import os
import sys
import psycopg2
import random
import string
import datetime
import time
from dotenv import load_dotenv
from urllib.parse import urlparse, parse_qs
from collections import deque
from rich.console import Console
from rich.live import Live
from rich.panel import Panel
from rich.progress import Progress, BarColumn, TextColumn, TimeRemainingColumn
from rich.status import Status
from rich.console import Group

load_dotenv()
DATABASE_URL = os.getenv("DATABASE_URL")

console = Console()
TARGET_ROWS = 50_000
COMMIT_BATCH_SIZE = 5000

TICKET_SOURCES = ['Call', 'Whatsapp', 'Email', 'Web', 'App']
STATUSES = ['Open', 'Pending', 'Closed']
POSITIONS = ['L1', 'L2']
DEPARTMENTS = [1, 2, 3, 4, 5]
SOURCE_INFOS = ['Inbound', 'Outbound', 'WhatsApp Bussiness', 'Internal']
BOOLEAN_CHARGE = [0, 1, None]
SLAS = [1, 3, 5, 7]
CALL_ACTIONS = [0, 14, 5, 10]
ACIDS = [1, 2, None]
SERVICE_AREAS = ['10', '11', '12', '15', '19', '20', '27', '28', '31', '32', '33', '11B7', '12B0', '10B1', None]
SERVICE_TYPES = ['ZX', 'Z2', None]

def validate_config():
    if not DATABASE_URL:
        console.print("❌ [bold red]Error: Variabel DATABASE_URL belum diatur di file .env.[/bold red]")
        sys.exit(1)
    console.print("👍 [green]Konfigurasi berhasil dimuat dari .env[/green]")


def get_db_connection():
    try:
        parsed_url = urlparse(DATABASE_URL)
        query_params = parse_qs(parsed_url.query)
        schema = query_params.get('schema', [None])[0]
        clean_dsn = parsed_url._replace(query="").geturl()
        conn = psycopg2.connect(dsn=clean_dsn)
        db_name = conn.get_dsn_parameters().get('dbname', 'N/A')
        host = conn.get_dsn_parameters().get('host', 'N/A')
        
        if schema:
            console.print(f"   [dim]Mengatur search_path ke schema: '{schema}'...[/dim]")
            with conn.cursor() as cursor:
                cursor.execute(f"SET search_path = %s", (schema,))
            console.print(f"🔌 [green]Berhasil terhubung ke database '{db_name}' di {host} (Schema: '{schema}').[/green]")
        else:
            console.print(f"🔌 [green]Berhasil terhubung ke database '{db_name}' di {host} (Schema: default).[/green]")
        return conn
        
    except psycopg2.Error as e:
        console.print(f"❌ [bold red]Gagal terhubung ke database PostgreSQL: {e}[/bold red]")
        return None
    except Exception as e:
        console.print(f"❌ [bold red]Error parsing DATABASE_URL: {e}[/bold red]")
        return None

def random_string(length=10):
    return ''.join(random.choices(string.ascii_uppercase + string.digits, k=length))

def random_customer_id():
    prefix = random.choice(['E', 'F'])
    return prefix + ''.join(random.choices(string.digits, k=8))

def random_name():
    first_names = ['Adi', 'Budi', 'Citra', 'Dewi', 'Eka', 'Fajar', 'Gita', 'Hadi']
    last_names = ['Susanto', 'Wijaya', 'Lestari', 'Setiawan', 'Putri', 'Nugroho']
    return f"{random.choice(first_names)} {random.choice(last_names)}"

def random_datetime(start_year=2025, end_year=2028):
    start = datetime.datetime(start_year, 1, 1)
    end = datetime.datetime(end_year, 12, 31)
    return start + datetime.timedelta(
        seconds=random.randint(0, int((end - start).total_seconds()))
    )

def main():
    console.print("🚀 [bold blue]Memulai skrip untuk memasukkan data tiket...[/bold blue]")
    validate_config()
    
    conn = get_db_connection()
    if not conn:
        return

    cursor = None
    rows_generated = 0
    start_time = time.time()
    
    try:
        cursor = conn.cursor()
        
        with Status("📊 Menghitung baris yang sudah ada...", spinner="dots", console=console):
            cursor.execute('SELECT COUNT(id) FROM "tickets"')
            existing_rows = cursor.fetchone()[0] or 0
        console.print(f"✅ [green]Ditemukan {existing_rows:,} baris di dalam tabel.[/green]")

        rows_to_generate = TARGET_ROWS - existing_rows

        if rows_to_generate <= 0:
            console.print(f"🎉 [green]Tabel sudah mencapai target ({existing_rows:,} baris). Proses selesai.[/green]")
            return

        console.print(f"🎯 [cyan]Target: {TARGET_ROWS:,} baris. Perlu menambahkan {rows_to_generate:,} baris lagi.[/cyan]")

        with Status("🔍 Mencari ID tiket terakhir...", spinner="dots", console=console):
            cursor.execute('SELECT MAX(id) FROM "tickets"')
            result = cursor.fetchone()
            current_id = (result[0] or 0) + 1
        console.print(f"✅ [green]Memulai dari ID: {current_id}[/green]\n")

        column_names = [
            'id', 'customer_id', 'ticket_number', 'ticket_source', 'status', 'region_id', 'coordinates', 'address', 'complaint_detail', 
            'response_detail', 'sla', 'persen_sla', 'ticket_position', 'department_id', 'remark', 
            'remark_date', 'source_information', 'thread_id', 'account_id', 'account_name', 
            'user_create', 'date_create', 'user_closed', 'date_closed', 'last_response_by', 
            'last_response_at', 'equipment_id', 'scaid', 'acid', 'model_id', 'product_id', 
            'callaction_id', 'charge_type', 'service_area', 'service_type', 'request_date', 
            'sent_date_sap', 'sent_msg_sap'
        ]
        
        column_names_str = ', '.join([f'"{col}"' for col in column_names])
        placeholders_list = ['%s'] * len(column_names)
        try:
            coordinates_index = column_names.index('coordinates')
            placeholders_list[coordinates_index] = 'ST_PointFromText(%s, 4326)'
        except ValueError:
            console.print("⚠️ [yellow]Peringatan: Kolom 'coordinates' tidak ditemukan.[/yellow]")
            pass
        placeholders = ', '.join(placeholders_list)
        insert_query = f"INSERT INTO tickets ({column_names_str}) VALUES ({placeholders})"

        progress_bar = Progress(
            TextColumn("🔄 Memasukkan data..."),
            BarColumn(),
            "[progress.percentage]{task.percentage:>3.0f}%",
            "({task.completed} dari {task.total} baris)",
            TimeRemainingColumn(),
            transient=True
        )
        
        log_messages = deque(maxlen=5)
        for _ in range(5): log_messages.append("")
        
        log_panel = Panel("\n".join(log_messages), title="[blue]Detail Logs[/blue]", height=7, border_style="dim")
        render_group = Group(log_panel, progress_bar)
        task_id = progress_bar.add_task("generate", total=rows_to_generate)
        
        with Live(render_group, console=console) as live:
            for i in range(rows_to_generate):
                create_dt = random_datetime()
                new_row_tuple = (
                    current_id, random_customer_id(), create_dt.strftime('%Y%m%d%H%M%S') + str(random.randint(100, 999)),
                    random.choice(TICKET_SOURCES), random.choice(STATUSES), None,
                    'POINT(0 0)', f"Alamat Dummy No. {current_id}", f"Detail keluhan untuk tiket {current_id}",
                    f"Detail respon untuk tiket {current_id}", random.choice(SLAS), None, random.choice(POSITIONS),
                    random.choice(DEPARTMENTS), f"Remark untuk {current_id}" if random.random() > 0.8 else None, None,
                    random.choice(SOURCE_INFOS), random_string(20), random_string(15), random_name(),
                    f"agent{random.randint(1, 100)}", create_dt, None, None, f"agent{random.randint(1, 100)}",
                    create_dt + datetime.timedelta(minutes=random.randint(1, 60)),
                    random_string(12) if random.random() > 0.2 else None, None, random.choice(ACIDS),
                    f"MODEL-{random_string(8)}", f"PRODUCT-{random_string(10)}", random.choice(CALL_ACTIONS),
                    random.choice(BOOLEAN_CHARGE), random.choice(SERVICE_AREAS), random.choice(SERVICE_TYPES),
                    None, None, None
                )
                
                cursor.execute(insert_query, new_row_tuple)
                
                log_msg = f"Menyiapkan [bold yellow]ID: {current_id}[/]"
                log_messages.append(log_msg)
                
                if (i + 1) % COMMIT_BATCH_SIZE == 0:
                    conn.commit()
                    log_messages.append(f"[bold green]✅ Batch di-commit! ({i + 1} baris diproses)[/bold green]")
                
                log_panel.renderable = "\n".join(log_messages)
                progress_bar.update(task_id, advance=1)
                
                current_id += 1
                rows_generated += 1

            conn.commit()
            live.console.print(f"--- [bold green]Transaksi Final Berhasil[/bold green] ---")

        total_duration = time.time() - start_time
        rows_per_sec_total = rows_generated / total_duration if total_duration > 0 else 0
        
        console.print(f"\n--- [bold green]Proses Generate Selesai[/bold green] ---")
        console.print(f"⏱️  [bold]Durasi Total:[/bold] {total_duration:.2f} detik")
        console.print(f"📊 [bold]Total Baris:[/bold] {rows_generated} baris berhasil ditambahkan.")
        console.print(f"⚡ [bold]Performa:[/bold] {rows_per_sec_total:.2f} baris/detik")

    except KeyboardInterrupt:
        console.print("\n🛑 [bold yellow]Proses dihentikan oleh pengguna.[/bold yellow]")
        if conn and not conn.closed:
            conn.rollback()
    except psycopg2.Error as e:
        console.print(f"\n❌ [bold red]Terjadi error saat memasukkan data: {e}[/bold red]")
        if conn and not conn.closed:
            console.print("--- [yellow]Transaksi Gagal, Mencoba Rollback...[/yellow] ---")
            try:
                conn.rollback()
                console.print("--- [green]Rollback Berhasil[/green] ---")
            except psycopg2.Error as rb_e:
                console.print(f"--- [red]Gagal melakukan Rollback karena koneksi terputus: {rb_e}[/red] ---")
        else:
            console.print("--- [red]Transaksi Gagal, koneksi sudah terputus.[/red] ---")
    finally:
        if conn and not conn.closed:
            if cursor:
                cursor.close()
            conn.close()
            console.print("🔌 [dim]Koneksi ke database ditutup.[/dim]")
        else:
            console.print("🔌 [dim]Koneksi ke database sudah terputus sebelumnya.[/dim]")
    
    console.print("\n--- [bold blue]Proses Selesai[/bold blue] ---")

if __name__ == "__main__":
    main()

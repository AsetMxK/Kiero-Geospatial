import { PrismaClient } from '@prisma/client';
import * as jose from 'jose';
import { randomUUID } from 'crypto';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

function parseArgs() {
    const args = process.argv.slice(2);
    const result = {};
    for (let i = 0; i < args.length; i++) {
        const arg = args[i];
        if (arg.startsWith('--')) {
            const key = arg.slice(2);
            let value = args[i + 1] && !args[i + 1].startsWith('--') ? args[i + 1] : true;
            result[key] = value;
            if (value !== true) i++;
        }
    }
    return result;
}

async function registerClient() {
  const args = parseArgs();
  const { 
    clientName, 
    allowedOrigins, 
    authMethod = 'client_credentials', 
    publicKeyPath 
  } = args;

  try {
    // All human-readable output goes to stderr
    console.error('--- Client Registration (Non-Interactive) ---');
    
    if (!clientName || !allowedOrigins) {
      throw new Error('Usage: --clientName "Your Client Name" --allowedOrigins "http://host1,http://host2" [--authMethod private_key_jwt] [--publicKeyPath /path/to/key.pem]');
    }
    
    const origins = allowedOrigins.split(',').map(o => o.trim()).filter(Boolean);
    if (origins.length === 0) throw new Error('You must provide at least one valid origin in --allowedOrigins.');

    const clientId = `client_${randomUUID()}`;
    let publicKeyPem, privateKeyPem = null;
    
    console.error(`\nRegistering client with authentication method: ${authMethod}`);

    if (authMethod === 'private_key_jwt') {
        if (!publicKeyPath || !fs.existsSync(publicKeyPath)) {
            throw new Error(`--publicKeyPath is required for private_key_jwt method and the file must exist. Provided: ${publicKeyPath}`);
        }
        console.error(`🔑 Reading public key from: ${publicKeyPath}`);
        publicKeyPem = fs.readFileSync(path.resolve(publicKeyPath), 'utf8');
        privateKeyPem = null;

    } else { // Default to client_credentials
        console.error('\n🔄 Generating RSA (RS256) key pair for internal client...');
        const { publicKey, privateKey } = await jose.generateKeyPair('RS256');
        publicKeyPem = await jose.exportSPKI(publicKey);
        privateKeyPem = await jose.exportPKCS8(privateKey);
        console.error('✅ Key pair generated and will be stored internally.');
    }

    console.error(`🔄 Saving client '${clientName}' to the database...`);
    const client = await prisma.client.create({
      data: {
        clientName: clientName,
        clientId,
        authMethod: authMethod,
        publicKey: publicKeyPem,
        privateKey: privateKeyPem,
        allowedOrigins: origins.join(','),
      },
    });

    console.error('\n--- ✅ Client Registration Successful! ---');
    console.error(`Client Name: ${client.clientName}`);
    console.error(`Auth Method: ${client.authMethod}`);
    console.error(`Allowed Origins: ${client.allowedOrigins}`);
    console.error("\n🔑 **Client ID (Share this with the client):**");
    
    // The ONLY output to stdout is the client ID. This makes it machine-readable.
    console.log(client.clientId);

  } catch (error) {
    console.error('\n❌ An error occurred during client registration:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

registerClient();

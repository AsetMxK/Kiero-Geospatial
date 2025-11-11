const CalendarIcon = ({ className }) => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="currentColor"
        className={className}
    >
        <path
            fillRule="evenodd"
            d="M5.25 2.25A.75.75 0 016 3v1.5a.75.75 0 01-1.5 0V3a.75.75 0 01.75-.75zM18 4.5a.75.75 0 00-1.5 0V3a.75.75 0 001.5 0v1.5z"
        />
        <path
            fillRule="evenodd"
            d="M3 8.25a.75.75 0 01.75-.75h16.5a.75.75 0 010 1.5H3.75A.75.75 0 013 8.25zM4.502 11.125a.75.75 0 01.75.75v3.375c0 .414.336.75.75.75h12a.75.75 0 01.75-.75v-3.375a.75.75 0 011.5 0v3.375c0 1.24-1.01 2.25-2.25 2.25h-12c-1.24 0-2.25-1.01-2.25-2.25v-3.375a.75.75 0 01.75-.75z"
            clipRule="evenodd"
        />
        <path
            d="M3 6.75A2.25 2.25 0 015.25 4.5h13.5A2.25 2.25 0 0121 6.75v10.5A2.25 2.25 0 0118.75 19.5H5.25A2.25 2.25 0 013 17.25V6.75z"
        />
    </svg>
);

export default CalendarIcon;

const ChevronIcon = ({ isOpen }) => (
  <svg
    className={`w-5 h-5 text-gray-600 transition-transform duration-300 ease-in-out ${isOpen ? 'rotate-180' : ''}`}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path>
  </svg>
);

export default ChevronIcon;
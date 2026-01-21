
/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                'brand-dark': '#0a0a0a',
                'brand-primary': '#3b82f6', // Example blue
            },
            fontFamily: {
                'sans': ['"Outfit"', 'sans-serif'],
            }
        },
    },
    plugins: [],
}

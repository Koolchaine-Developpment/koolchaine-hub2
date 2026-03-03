/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                brand: {
                    bg: 'var(--bg)',
                    surface: 'var(--surface)',
                    dark: 'var(--dark)',
                    border: 'var(--border)',
                },
                text: {
                    primary: 'var(--text-primary)',
                    secondary: 'var(--text-secondary)',
                },
                accent: {
                    pink: 'var(--pink)',
                    green: 'var(--green)',
                    blue: 'var(--blue)',
                    yellow: 'var(--yellow)',
                }
            },
            fontFamily: {
                sans: ['Poppins', 'sans-serif'],
                heading: ['"Archivo Black"', 'sans-serif'],
            }
        },
    },
    plugins: [],
}

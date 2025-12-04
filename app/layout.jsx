import './globals.css'

export const metadata = {
  title: 'مارو منیجر | سیستم مدیریت گارانتی و تعمیرات',
  description: 'سیستم جامع مدیریت گارانتی و تعمیرات دستگاه‌ها',
}

export default function RootLayout({ children }) {
  return (
    <html lang="fa" dir="rtl">
      <head>
        <link rel="preconnect" href="https://cdn.jsdelivr.net" />
      </head>
      <body className="font-yekan antialiased">
        {children}
      </body>
    </html>
  )
}

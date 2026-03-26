'use client'

import Link from 'next/link'

const footerColumns = [
  {
    title: 'دسترسی سریع',
    items: [
      { title: 'صفحه اصلی', link: '/' },
      { title: 'اخبار', link: '/news' },
      { title: 'مقالات', link: '/articles' },
      { title: 'بررسی‌ها', link: '/reviews' },
    ],
  },
  {
    title: 'برندها',
    items: [
      { title: 'سامسونگ', link: '/tag/samsung' },
      { title: 'اپل', link: '/tag/apple' },
      { title: 'شیائومی', link: '/tag/xiaomi' },
      { title: 'هوآوی', link: '/tag/huawei' },
    ],
  },
  {
    title: 'راهنما',
    items: [
      { title: 'درباره ما', link: '/about' },
      { title: 'تماس با ما', link: '/contact' },
      { title: 'قوانین و مقررات', link: '/terms' },
    ],
  },
]

export default function Footer() {
  return (
    <footer className="md:px-4 md:pb-4 mt-auto relative bg-gray-50">
      <div className="bg-footer text-white rounded-t-2xl md:rounded-2xl">
        <div className="footer-container container xl:max-w-screen-xl px-4 lg:px-10 py-10 md:pt-16 md:pb-6 grid grid-cols-1 md:grid-cols-[1.5fr_4fr] gap-10">
          <section>
            <img src="/images/logo-white.png" alt="لوگوی جی‌اس‌ام" className="h-6 md:h-8 object-contain w-fit" />
            <p className="mt-6 text-justify body-sm">
              جی‌اس‌ام، اولین رسانه‌ تخصصی موبایل در ایران محسوب می‌شود. رسالت ما در جی‌اس‌ام راهنمای انتخاب و خرید موبایل در ایران است و در این راستا تلاش می‌کنیم با بررسی‌های تخصصی، اخبار و راهنمای خرید، همراه مخاطب باشیم.
            </p>
          </section>
          <section className="grid grid-cols-1 md:grid-cols-3 gap-10 w-full">
            {footerColumns.map((col, i) => (
              <div key={i} className="md:justify-self-center">
                <div className="h4 w-fit">{col.title}</div>
                <ul className="space-y-4 mt-6 body-sm w-fit">
                  {col.items.map((item, j) => (
                    <li key={j}>
                      <Link href={item.link}>{item.title}</Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </section>
          <section className="caption md:col-span-2 border-t border-gray-600">
            <p className="pt-6 text-center">
              &copy; ۱۴۰۳ - ۱۳۸۷ کپی بخش یا کل هر کدام از مطالب جی اس ام تنها با کسب مجوز مکتوب امکان پذیر است.
            </p>
          </section>
        </div>
      </div>
    </footer>
  )
}

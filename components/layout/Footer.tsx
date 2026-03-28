'use client'

import Link from 'next/link'
import { ChevronLeft, Send } from 'lucide-react'
import { useState } from 'react'

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

const socialLinks = [
  { name: 'تلگرام', icon: 'telegram', href: '#', hoverColor: 'hover:text-[#0088cc]' },
  { name: 'اینستاگرام', icon: 'instagram', href: '#', hoverColor: 'hover:text-[#E4405F]' },
  { name: 'ایکس', icon: 'x', href: '#', hoverColor: 'hover:text-white' },
  { name: 'یوتیوب', icon: 'youtube', href: '#', hoverColor: 'hover:text-[#FF0000]' },
]

function SocialIcon({ icon }: { icon: string }) {
  switch (icon) {
    case 'telegram':
      return (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .38z" />
        </svg>
      )
    case 'instagram':
      return (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
        </svg>
      )
    case 'x':
      return (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
      )
    case 'youtube':
      return (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
          <path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
        </svg>
      )
    default:
      return null
  }
}

export default function Footer() {
  const [email, setEmail] = useState('')

  return (
    <footer className="md:px-4 md:pb-4 mt-auto relative bg-gray-50">
      {/* Animated gradient top border */}
      <div className="h-1 bg-gradient-to-l from-primary-500 via-primary-600 to-primary-700 animate-gradient-x" />

      <div className="bg-footer text-white rounded-t-2xl md:rounded-2xl">
        <div className="footer-container container xl:max-w-screen-xl px-4 lg:px-10 py-10 md:pt-16 md:pb-6">
          {/* Newsletter Section */}
          <section className="mb-10 pb-8 border-b border-gray-600">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              <div>
                <h3 className="h3 text-white mb-2">عضویت در خبرنامه</h3>
                <p className="body-sm text-gray-300">
                  جدیدترین اخبار و بررسی‌ها را مستقیما در ایمیل خود دریافت کنید
                </p>
              </div>
              <form
                onSubmit={(e) => e.preventDefault()}
                className="flex w-full md:w-auto gap-2"
              >
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="ایمیل خود را وارد کنید"
                  className="
                    h-11 w-full md:w-72 bg-white/10 rounded-lg px-4
                    border border-gray-600 body-sm text-white
                    placeholder-gray-400 outline-none
                    focus:border-primary-500 focus:bg-white/15
                    transition-all duration-300
                  "
                  dir="ltr"
                />
                <button
                  type="submit"
                  className="
                    h-11 px-5 bg-primary-500 rounded-lg subtitle-sm
                    flex items-center gap-2 flex-shrink-0
                    hover:bg-primary-600 active:scale-95
                    transition-all duration-200
                  "
                >
                  <Send className="w-4 h-4 rotate-180" />
                  <span>عضویت</span>
                </button>
              </form>
            </div>
          </section>

          {/* Main footer grid */}
          <div className="grid grid-cols-1 md:grid-cols-[1.5fr_4fr] gap-10">
            <section>
              <img src="/images/logo.png" alt="لوگوی جی‌اس‌ام" className="h-6 md:h-8 object-contain w-fit" />
              <p className="mt-6 text-justify body-sm text-gray-300 leading-7">
                جی‌اس‌ام، اولین رسانه‌ تخصصی موبایل در ایران محسوب می‌شود. رسالت ما در جی‌اس‌ام راهنمای انتخاب و خرید موبایل در ایران است و در این راستا تلاش می‌کنیم با بررسی‌های تخصصی، اخبار و راهنمای خرید، همراه مخاطب باشیم.
              </p>

              {/* Social Icons */}
              <div className="flex items-center gap-3 mt-6">
                {socialLinks.map((social) => (
                  <a
                    key={social.name}
                    href={social.href}
                    aria-label={social.name}
                    className={`
                      w-10 h-10 rounded-full bg-white/10
                      flex-center text-gray-300
                      transition-all duration-300
                      hover:bg-white/20 ${social.hoverColor}
                      hover:scale-110
                    `}
                  >
                    <SocialIcon icon={social.icon} />
                  </a>
                ))}
              </div>
            </section>

            <section className="grid grid-cols-1 md:grid-cols-3 gap-10 w-full">
              {footerColumns.map((col, i) => (
                <div key={i} className="md:justify-self-center">
                  <div className="h4 w-fit text-white">{col.title}</div>
                  <ul className="space-y-3 mt-6 body-sm w-fit">
                    {col.items.map((item, j) => (
                      <li key={j}>
                        <Link
                          href={item.link}
                          className="
                            group flex items-center gap-1 text-gray-300
                            hover:text-white transition-colors duration-300
                          "
                        >
                          <ChevronLeft className="
                            w-3.5 h-3.5 opacity-0
                            -translate-x-2 group-hover:opacity-100
                            group-hover:translate-x-0
                            transition-all duration-300
                          " />
                          <span>{item.title}</span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </section>
          </div>

          {/* Trust Badges */}
          <section className="mt-10 pt-6 border-t border-gray-600">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-white/10 rounded-lg flex-center text-gray-400 border border-gray-600">
                  <span className="caption text-center leading-tight">نماد<br />اعتماد</span>
                </div>
                <div className="w-16 h-16 bg-white/10 rounded-lg flex-center text-gray-400 border border-gray-600">
                  <span className="caption text-center leading-tight">ساماندهی</span>
                </div>
              </div>
              <p className="caption text-gray-400 text-center">
                &copy; ۱۴۰۳ - ۱۳۸۷ کپی بخش یا کل هر کدام از مطالب جی اس ام تنها با کسب مجوز مکتوب امکان پذیر است.
              </p>
            </div>
          </section>
        </div>
      </div>
    </footer>
  )
}

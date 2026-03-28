import { Header, Footer } from '@/components/layout'
import BackToTop from '@/components/common/BackToTop'

export default function SiteLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <Header />
      <main className="min-h-screen animate-fade-in">
        {children}
      </main>
      <Footer />
      <BackToTop />
    </>
  )
}

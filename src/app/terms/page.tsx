import Link from 'next/link';

export const metadata = {
  title: 'Terms of Service - Haisa Focus',
  description: 'Terms of Service for Haisa Focus application',
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="text-2xl font-bold text-gray-800">
            🎯 Haisa Focus
          </Link>
          <nav className="flex gap-4">
            <Link href="/privacy" className="text-sm text-gray-500 hover:text-gray-700">
              Privacy
            </Link>
            <Link href="/terms" className="text-sm text-blue-600 font-medium">
              Terms
            </Link>
          </nav>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-4 py-12">
        <article className="bg-white rounded-xl shadow-sm p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">Terms of Service</h1>
          <p className="text-gray-500 mb-8">Last updated: December 2024</p>

          <div className="prose prose-gray max-w-none">
            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">1. Acceptance of Terms</h2>
              <p className="text-gray-600 mb-4">
                By accessing and using Haisa Focus, you accept and agree to be bound by these Terms of Service.
                If you do not agree to these terms, please do not use our service.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">2. Description of Service</h2>
              <p className="text-gray-600 mb-4">
                Haisa Focus is a web-based productivity application that provides:
              </p>
              <ul className="list-disc pl-6 text-gray-600 mb-4">
                <li>Focus timer with stopwatch and pomodoro modes</li>
                <li>Background music player with mood-based playlists</li>
                <li>8D audio effect for immersive listening</li>
                <li>Local statistics tracking for focus sessions</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">3. User Responsibilities</h2>
              <p className="text-gray-600 mb-4">As a user of Haisa Focus, you agree to:</p>
              <ul className="list-disc pl-6 text-gray-600 mb-4">
                <li>Use the service for lawful purposes only</li>
                <li>Not attempt to interfere with or disrupt the service</li>
                <li>Not attempt to bypass any security measures</li>
                <li>Not use automated systems to access the service</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">4. Intellectual Property</h2>
              <p className="text-gray-600 mb-4">
                All content, features, and functionality of Haisa Focus, including but not limited to text,
                graphics, logos, and software, are the exclusive property of Haisa Focus and are protected
                by copyright, trademark, and other intellectual property laws.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">5. Advertising</h2>
              <p className="text-gray-600 mb-4">
                Haisa Focus displays advertisements from third-party advertising networks. By using our service,
                you acknowledge that:
              </p>
              <ul className="list-disc pl-6 text-gray-600 mb-4">
                <li>Advertisements may be displayed during your use of the service</li>
                <li>We are not responsible for the content of third-party advertisements</li>
                <li>Clicking on advertisements may redirect you to external websites</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">6. Disclaimer of Warranties</h2>
              <p className="text-gray-600 mb-4">
                Haisa Focus is provided &quot;as is&quot; and &quot;as available&quot; without any warranties of any kind,
                either express or implied. We do not guarantee that the service will be uninterrupted,
                secure, or error-free.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">7. Limitation of Liability</h2>
              <p className="text-gray-600 mb-4">
                To the fullest extent permitted by law, Haisa Focus shall not be liable for any indirect,
                incidental, special, consequential, or punitive damages arising out of or related to your
                use of the service.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">8. Changes to Terms</h2>
              <p className="text-gray-600 mb-4">
                We reserve the right to modify these Terms of Service at any time. Changes will be effective
                immediately upon posting. Your continued use of the service after any changes constitutes
                acceptance of the new terms.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">9. Contact Us</h2>
              <p className="text-gray-600 mb-4">
                If you have any questions about these Terms of Service, please contact us at:
                legal@haisafocus.com
              </p>
            </section>
          </div>
        </article>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t mt-auto">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm text-gray-500">© 2024 Haisa Focus. All rights reserved.</p>
            <div className="flex gap-6">
              <Link href="/privacy" className="text-sm text-gray-500 hover:text-gray-700">
                Privacy Policy
              </Link>
              <Link href="/terms" className="text-sm text-gray-500 hover:text-gray-700">
                Terms of Service
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

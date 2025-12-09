import Link from 'next/link';

export const metadata = {
  title: 'Privacy Policy - Haisa Focus',
  description: 'Privacy Policy for Haisa Focus application',
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="text-2xl font-bold text-gray-800">
            🎯 Haisa Focus
          </Link>
          <nav className="flex gap-4">
            <Link href="/privacy" className="text-sm text-blue-600 font-medium">
              Privacy
            </Link>
            <Link href="/terms" className="text-sm text-gray-500 hover:text-gray-700">
              Terms
            </Link>
          </nav>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-4 py-12">
        <article className="bg-white rounded-xl shadow-sm p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">Privacy Policy</h1>
          <p className="text-gray-500 mb-8">Last updated: December 2024</p>

          <div className="prose prose-gray max-w-none">
            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">1. Introduction</h2>
              <p className="text-gray-600 mb-4">
                Welcome to Haisa Focus. We respect your privacy and are committed to protecting your personal data.
                This privacy policy explains how we collect, use, and safeguard your information when you use our
                focus timer and music player application.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">2. Data We Collect</h2>
              <h3 className="text-lg font-medium text-gray-700 mb-2">2.1 Local Storage Data</h3>
              <p className="text-gray-600 mb-4">
                We store the following data locally on your device using browser localStorage:
              </p>
              <ul className="list-disc pl-6 text-gray-600 mb-4">
                <li>Timer state and preferences</li>
                <li>Focus session statistics (duration, date)</li>
                <li>Music player preferences (volume, mood selection, 8D audio setting)</li>
              </ul>
              <p className="text-gray-600 mb-4">
                This data never leaves your device and is not transmitted to our servers.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">3. Cookies and Tracking</h2>
              <h3 className="text-lg font-medium text-gray-700 mb-2">3.1 Essential Cookies</h3>
              <p className="text-gray-600 mb-4">
                We use essential cookies to ensure the basic functionality of our application.
              </p>
              
              <h3 className="text-lg font-medium text-gray-700 mb-2">3.2 Analytics</h3>
              <p className="text-gray-600 mb-4">
                We may use analytics services (such as Google Analytics or Plausible) to understand how users
                interact with our application. This helps us improve the user experience. Analytics data is
                anonymized and aggregated.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">4. Advertising Partners</h2>
              <p className="text-gray-600 mb-4">
                We work with the following advertising partners to display ads on our platform:
              </p>
              <ul className="list-disc pl-6 text-gray-600 mb-4">
                <li><strong>Google AdSense</strong> - May use cookies to serve personalized ads</li>
                <li><strong>Adsterra</strong> - Display advertising network</li>
                <li><strong>Monetag</strong> - Advertising platform</li>
              </ul>
              <p className="text-gray-600 mb-4">
                These partners may collect information about your browsing activity to serve relevant advertisements.
                You can opt out of personalized advertising through our consent banner or by adjusting your browser settings.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">5. Your Rights</h2>
              <p className="text-gray-600 mb-4">You have the right to:</p>
              <ul className="list-disc pl-6 text-gray-600 mb-4">
                <li>Clear your local data at any time by clearing your browser storage</li>
                <li>Opt out of personalized advertising</li>
                <li>Request information about data collected by our advertising partners</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">6. Contact Us</h2>
              <p className="text-gray-600 mb-4">
                If you have any questions about this Privacy Policy, please contact us at:
                privacy@haisafocus.com
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

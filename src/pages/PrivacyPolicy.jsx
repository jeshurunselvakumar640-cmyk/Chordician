import React from "react";

export default function PrivacyPolicy() {
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#0b0f19",
        color: "#e5e7eb",
        padding: "40px 20px",
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      }}
    >
      <main
        style={{
          maxWidth: "900px",
          margin: "0 auto",
          lineHeight: 1.7,
        }}
      >
        <a
          href="/"
          style={{
            color: "#93c5fd",
            textDecoration: "none",
          }}
        >
          ← Back to Chordician
        </a>

        <h1 style={{ marginTop: "30px", fontSize: "36px" }}>
          Privacy Policy
        </h1>

        <p>
          <strong>Last updated:</strong> October 2, 2026
        </p>

        <p>
          Chordician ("we", "our", or "the app") is a web application designed
          to help users view, organize, and work with songs, lyrics, and
          musical chords. This Privacy Policy explains what information we
          collect and how we use it.
        </p>

        <h2>1. Information We Collect</h2>

        <p>Depending on how you use Chordician, we may collect:</p>

        <ul>
          <li>Email address used for account authentication.</li>
          <li>Information associated with your Chordician account.</li>
          <li>Songs, lyrics, chords, and other content you choose to save.</li>
          <li>Information required to provide and maintain the service.</li>
        </ul>

        <h2>2. How We Use Information</h2>

        <p>Information may be used to:</p>

        <ul>
          <li>Create and authenticate your account.</li>
          <li>Store and display your saved songs and musical content.</li>
          <li>Provide Chordician features and functionality.</li>
          <li>Maintain, secure, and improve the application.</li>
          <li>Troubleshoot technical problems.</li>
        </ul>

        <h2>3. Firebase</h2>

        <p>
          Chordician uses Firebase services for authentication and data
          storage. Firebase may process information necessary to provide these
          services according to Google's applicable policies.
        </p>

        <p>
          Chordician uses email/password authentication. We do not require
          users to sign in with a Google account.
        </p>

        <h2>4. Cookies and Local Storage</h2>

        <p>
          Chordician and its supporting services may use browser storage,
          cookies, or similar technologies to maintain authentication sessions,
          preferences, and application functionality.
        </p>

        <h2>5. Offline Storage</h2>

        <p>
          Chordician may store certain song data locally in your browser to
          support offline functionality. Locally stored information remains on
          your device unless you clear the relevant browser storage.
        </p>

        <h2>6. Data Sharing</h2>

        <p>
          We do not sell your personal information. Information may be
          processed by service providers required to operate Chordician, such
          as Firebase and hosting infrastructure.
        </p>

        <h2>7. Data Security</h2>

        <p>
          We take reasonable measures to protect information used by the
          application. However, no internet service or electronic storage
          system can be guaranteed to be completely secure.
        </p>

        <h2>8. Account Deletion</h2>

        <p>
          If you want to delete your Chordician account or request deletion of
          associated personal information, please contact the Chordician
          administrator.
        </p>

        <h2>9. Children's Privacy</h2>

        <p>
          Chordician is not specifically directed toward children under the
          age of 13. We do not knowingly collect personal information from
          children under 13.
        </p>

        <h2>10. Changes to This Policy</h2>

        <p>
          We may update this Privacy Policy from time to time. Any changes will
          be reflected on this page with an updated "Last updated" date.
        </p>

        <h2>11. Contact</h2>

        <p>
          If you have questions about this Privacy Policy or your personal
          information, please contact the Chordician administrator.
        </p>

        <hr
          style={{
            margin: "40px 0",
            border: 0,
            borderTop: "1px solid #374151",
          }}
        />

        <p style={{ fontSize: "14px", color: "#9ca3af" }}>
          © 2026 Chordician. All rights reserved.
        </p>
      </main>
    </div>
  );
}


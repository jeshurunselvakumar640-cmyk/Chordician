import React from "react";

export default function TermsOfService() {
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
          Terms of Service
        </h1>

        <p>
          <strong>Last updated:</strong> October 2, 2026
        </p>

        <p>
          Welcome to Chordician. By accessing or using Chordician, you agree
          to these Terms of Service. If you do not agree with these terms,
          please do not use the application.
        </p>

        <h2>1. About Chordician</h2>

        <p>
          Chordician is a web application that provides tools for viewing,
          organizing, editing, and working with songs, lyrics, and musical
          chords.
        </p>

        <h2>2. User Accounts</h2>

        <p>
          Some Chordician features require an account. You are responsible for
          maintaining the confidentiality of your account credentials and for
          activity performed through your account.
        </p>

        <p>
          You agree to provide accurate information when creating an account
          and to notify the administrator if you believe your account has been
          accessed without authorization.
        </p>

        <h2>3. User Content</h2>

        <p>
          Users may save or submit songs, lyrics, chords, and other content
          through Chordician.
        </p>

        <p>
          You are responsible for ensuring that the content you upload, save,
          or share does not violate applicable laws or the rights of other
          people.
        </p>

        <h2>4. Copyright</h2>

        <p>
          Chordician does not claim ownership of copyrighted material belonging
          to third parties. Users are responsible for using songs, lyrics,
          chords, and other copyrighted material in accordance with applicable
          copyright laws and the rights of the respective copyright holders.
        </p>

        <h2>5. Acceptable Use</h2>

        <p>You agree not to:</p>

        <ul>
          <li>Use Chordician for unlawful purposes.</li>
          <li>Attempt to gain unauthorized access to accounts or systems.</li>
          <li>Interfere with the operation or security of the application.</li>
          <li>Upload malicious software or harmful content.</li>
          <li>Abuse or intentionally overload the service.</li>
        </ul>

        <h2>6. Third-Party Services</h2>

        <p>
          Chordician uses third-party services such as Firebase and Vercel to
          provide authentication, data storage, hosting, and other
          infrastructure.
        </p>

        <p>
          Your use of those services through Chordician may also be subject to
          the applicable terms and policies of those third-party providers.
        </p>

        <h2>7. Availability</h2>

        <p>
          We aim to keep Chordician available and functional, but we do not
          guarantee that the service will always be available, uninterrupted,
          or free of errors.
        </p>

        <h2>8. Changes to the Service</h2>

        <p>
          Features, functionality, and content within Chordician may be
          modified, added, or removed at any time.
        </p>

        <h2>9. Account Suspension or Termination</h2>

        <p>
          Access to Chordician may be suspended or terminated if an account is
          used in violation of these Terms or in a way that may harm the
          service, its users, or third parties.
        </p>

        <h2>10. Disclaimer</h2>

        <p>
          Chordician is provided on an "as available" basis. To the extent
          permitted by applicable law, we make no guarantees regarding the
          accuracy, reliability, or uninterrupted availability of the
          application.
        </p>

        <h2>11. Limitation of Liability</h2>

        <p>
          To the extent permitted by applicable law, Chordician and its
          administrators will not be responsible for indirect, incidental, or
          consequential losses resulting from the use or inability to use the
          application.
        </p>

        <h2>12. Changes to These Terms</h2>

        <p>
          These Terms of Service may be updated from time to time. Continued
          use of Chordician after changes are published constitutes acceptance
          of the updated terms.
        </p>

        <h2>13. Contact</h2>

        <p>
          If you have questions regarding these Terms of Service, please
          contact the Chordician administrator.
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

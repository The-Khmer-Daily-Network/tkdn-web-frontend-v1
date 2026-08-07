import type { Metadata } from "next";
import LegalDocument, {
  LegalList,
  LegalSection,
} from "@/components/LegalDocument";
import { SITE_URL } from "@/config/site";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "Privacy Policy for The Khmer Daily mobile app and The Khmer Daily Network website. Learn what information we collect and how we use it.",
  alternates: {
    canonical: `${SITE_URL}/privacy-policy`,
  },
  openGraph: {
    title: "Privacy Policy | The Khmer Daily Network",
    description:
      "Privacy Policy for The Khmer Daily mobile app and related services.",
    url: `${SITE_URL}/privacy-policy`,
    type: "website",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function PrivacyPolicyPage() {
  return (
    <LegalDocument
      title="Privacy Policy"
      effectiveDate="August 7, 2026"
      otherLink={{ href: "/terms-of-use", label: "Terms of Use" }}
    >
      <p className="text-[15px] leading-relaxed text-gray-800">
        This Privacy Policy explains how{" "}
        <strong>The Khmer Daily Network</strong> (“we”, “us”, “our”) handles
        information in connection with the <strong>The Khmer Daily</strong>{" "}
        mobile application (the “App”) and related services.
      </p>

      <LegalSection title="1. Who we are">
        <LegalList
          items={[
            <>Publisher: The Khmer Daily Network</>,
            <>
              Website:{" "}
              <a
                href="https://www.thekhmerdailynetwork.com"
                className="font-medium text-blue-900 underline underline-offset-2 hover:text-blue-800"
              >
                https://www.thekhmerdailynetwork.com
              </a>
            </>,
            <>
              Support:{" "}
              <a
                href="mailto:support@thekhmerdailynetwork.com"
                className="font-medium text-blue-900 underline underline-offset-2 hover:text-blue-800"
              >
                support@thekhmerdailynetwork.com
              </a>
            </>,
          ]}
        />
      </LegalSection>

      <LegalSection title="2. Information we collect">
        <p>
          The App is a news reader. We collect and process only what is needed
          to provide the service:
        </p>
        <LegalList
          items={[
            <>
              <strong>News content requests:</strong> When you open the App, it
              requests articles, categories, images, and audio from our servers
              so we can show you news.
            </>,
            <>
              <strong>Saved articles (bookmarks):</strong> If you save an
              article, it is stored <strong>only on your device</strong>. We do
              not upload your bookmarks to our servers.
            </>,
            <>
              <strong>Technical / network data:</strong> Standard connection
              data (such as IP address, device type, and request logs) may be
              processed by our hosting providers when the App loads content.
            </>,
            <>
              <strong>Support messages:</strong> If you email us, we receive the
              information you include in that email.
            </>,
          ]}
        />
        <p>We do <strong>not</strong> require you to create an account to use the App.</p>
      </LegalSection>

      <LegalSection title="3. Information we do not collect (current App version)">
        <p>Unless we clearly update this policy later, the App does <strong>not</strong>:</p>
        <LegalList
          items={[
            <>Require login / social sign-in</>,
            <>Access your contacts, camera, microphone, or location</>,
            <>Sell your personal information</>,
            <>Share your saved bookmarks with third parties for advertising</>,
          ]}
        />
      </LegalSection>

      <LegalSection title="4. How we use information">
        <p>We use information to:</p>
        <LegalList
          items={[
            <>Deliver and improve news content in the App</>,
            <>Keep the App secure and reliable</>,
            <>Fix bugs and understand technical issues</>,
            <>Respond to support requests</>,
          ]}
        />
      </LegalSection>

      <LegalSection title="5. Sharing of information">
        <p>
          We may use trusted service providers (for example hosting, CDN, or
          email) to operate our services. These providers process data only to
          help us run the App/website.
        </p>
        <p>
          Some stories may open third-party services (for example YouTube or
          external websites). Those services have their own privacy policies.
        </p>
      </LegalSection>

      <LegalSection title="6. Data retention">
        <LegalList
          items={[
            <>
              Bookmarks stay on your device until you remove them or uninstall
              the App.
            </>,
            <>
              Server logs are kept only as needed for security, operations, and
              legal requirements.
            </>,
            <>
              Support emails are kept as needed to respond to your request.
            </>,
          ]}
        />
      </LegalSection>

      <LegalSection title="7. Children’s privacy">
        <p>
          The App is intended for a general audience. We do not knowingly
          collect personal information from children under 13. If you believe a
          child has provided personal information, contact us and we will take
          appropriate action.
        </p>
      </LegalSection>

      <LegalSection title="8. Your choices">
        <p>You can:</p>
        <LegalList
          items={[
            <>Remove saved articles inside the App</>,
            <>Uninstall the App to delete local App data on your device</>,
            <>Contact us with privacy questions</>,
          ]}
        />
      </LegalSection>

      <LegalSection title="9. Security">
        <p>
          We take reasonable technical and organizational measures to protect
          information. No method of transmission or storage is 100% secure.
        </p>
      </LegalSection>

      <LegalSection title="10. International users">
        <p>
          Our services may be hosted in different countries. By using the App,
          you understand your information may be processed where our providers
          operate.
        </p>
      </LegalSection>

      <LegalSection title="11. Changes to this policy">
        <p>
          We may update this Privacy Policy from time to time. When we do, we
          will update the Effective date above. Continued use of the App after
          changes means you accept the updated policy.
        </p>
      </LegalSection>

      <LegalSection title="12. Contact us">
        <p>
          Email:{" "}
          <a
            href="mailto:support@thekhmerdailynetwork.com"
            className="font-medium text-blue-900 underline underline-offset-2 hover:text-blue-800"
          >
            support@thekhmerdailynetwork.com
          </a>
        </p>
        <p>
          Website:{" "}
          <a
            href="https://www.thekhmerdailynetwork.com"
            className="font-medium text-blue-900 underline underline-offset-2 hover:text-blue-800"
          >
            https://www.thekhmerdailynetwork.com
          </a>
        </p>
      </LegalSection>
    </LegalDocument>
  );
}

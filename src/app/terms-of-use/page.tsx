import type { Metadata } from "next";
import LegalDocument, {
  LegalList,
  LegalSection,
} from "@/components/LegalDocument";
import { SITE_URL } from "@/config/site";

export const metadata: Metadata = {
  title: "Terms of Use",
  description:
    "Terms of Use for The Khmer Daily mobile app operated by The Khmer Daily Network.",
  alternates: {
    canonical: `${SITE_URL}/terms-of-use`,
  },
  openGraph: {
    title: "Terms of Use | The Khmer Daily Network",
    description:
      "Terms of Use for The Khmer Daily mobile app and related services.",
    url: `${SITE_URL}/terms-of-use`,
    type: "website",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function TermsOfUsePage() {
  return (
    <LegalDocument
      title="Terms of Use"
      effectiveDate="August 7, 2026"
      otherLink={{ href: "/privacy-policy", label: "Privacy Policy" }}
    >
      <p className="text-[15px] leading-relaxed text-gray-800">
        By downloading or using the <strong>The Khmer Daily</strong> mobile
        application (the “App”), you agree to these Terms of Use. If you do not
        agree, do not use the App.
      </p>

      <LegalSection title="1. About the App">
        <p>
          The App is operated by <strong>The Khmer Daily Network</strong> and
          provides news articles, categories, videos, and related content for
          personal use.
        </p>
      </LegalSection>

      <LegalSection title="2. License to use">
        <p>
          We grant you a limited, non-exclusive, non-transferable, revocable
          license to use the App for personal, non-commercial purposes in
          accordance with these Terms.
        </p>
      </LegalSection>

      <LegalSection title="3. Content ownership">
        <p>
          Articles, images, audio, logos, and other materials in the App are
          owned by The Khmer Daily Network or our licensors.
        </p>
        <p>
          You may not copy, scrape, redistribute, republish, sell, or
          commercially exploit App content without our prior written permission,
          except as allowed by applicable law (for example fair use / fair
          dealing).
        </p>
      </LegalSection>

      <LegalSection title="4. Acceptable use">
        <p>You agree not to:</p>
        <LegalList
          items={[
            <>Misuse the App or attempt to disrupt our services</>,
            <>
              Reverse engineer or tamper with the App except where allowed by
              law
            </>,
            <>Use the App for unlawful, harmful, or abusive purposes</>,
            <>Attempt unauthorized access to our systems or data</>,
          ]}
        />
      </LegalSection>

      <LegalSection title="5. Third-party links and services">
        <p>
          The App may open third-party websites or video platforms (such as
          YouTube). We are not responsible for third-party content, policies, or
          practices. Their terms and privacy policies apply when you use those
          services.
        </p>
      </LegalSection>

      <LegalSection title="6. No account features (current version)">
        <p>
          The current App version does not provide user accounts, public
          comments, or social login. Features may change in future versions.
        </p>
      </LegalSection>

      <LegalSection title="7. Disclaimer">
        <p>
          News content is provided for general information. The App and content
          are provided <strong>“as is”</strong> and{" "}
          <strong>“as available.”</strong> To the fullest extent permitted by
          law, we disclaim warranties of merchantability, fitness for a
          particular purpose, accuracy, and non-infringement.
        </p>
        <p>
          We do not guarantee that content is always complete, uninterrupted,
          error-free, or up to date.
        </p>
      </LegalSection>

      <LegalSection title="8. Limitation of liability">
        <p>
          To the fullest extent permitted by law, The Khmer Daily Network and
          its team are not liable for any indirect, incidental, special,
          consequential, or punitive damages, or any loss of data, profits, or
          business, arising from your use of the App.
        </p>
      </LegalSection>

      <LegalSection title="9. App Store / Google Play terms">
        <p>
          If you downloaded the App from Apple App Store or Google Play, you
          also agree to any applicable store terms. Apple and Google are not
          responsible for providing maintenance or support for the App unless
          required by their rules.
        </p>
      </LegalSection>

      <LegalSection title="10. Changes">
        <p>
          We may update these Terms at any time. The Effective date will change
          when we do. Continued use of the App means you accept the updated
          Terms.
        </p>
      </LegalSection>

      <LegalSection title="11. Termination">
        <p>
          We may suspend or stop providing the App (or your access to it) if you
          violate these Terms or if we discontinue the service.
        </p>
      </LegalSection>

      <LegalSection title="12. Contact">
        <p>Questions about these Terms:</p>
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

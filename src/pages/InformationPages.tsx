import React, { useState } from 'react';
import {
  ShieldCheck,
  HelpCircle,
  Mail,
  Send,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Lock,
  ChevronDown,
  ChevronUp,
  MapPin,
  Clock,
  Wrench
} from 'lucide-react';

interface InfoPageProps {
  onNavigate: (path: string, params?: any) => void;
}

// -------------------------------------------------------------
// ABOUT PAGE
// -------------------------------------------------------------
export const AboutPage: React.FC<InfoPageProps> = ({ onNavigate }) => {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 space-y-10">
      <div className="space-y-3">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-stone-900 tracking-tight">
          About NeighbourLend
        </h1>
        <p className="text-base text-stone-600 leading-relaxed">
          NeighbourLend is built on a simple conviction: the things we need to build, fix, garden, and explore are already present right down the street.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-sm text-stone-700 leading-relaxed">
        <div className="space-y-3">
          <h3 className="font-bold text-stone-900 text-base">Our Mission</h3>
          <p>
            Millions of specialized tools—from high-pressure washers and rotary hammer drills to carpet extractors and 4-season tents—sit in suburban garages used for less than 15 minutes a year. Meanwhile, neighbors buy identical items or delay home maintenance due to equipment costs.
          </p>
          <p>
            NeighbourLend eliminates this barrier through safe, localized equipment sharing with verified identities, mutual security deposits, and transparent reviews.
          </p>
        </div>

        <div className="space-y-3">
          <h3 className="font-bold text-stone-900 text-base">Mutual Trust & Stewardship</h3>
          <p>
            Whether offering a tool for $0/day as mutual community aid or earning supplementary household income from high-end landscaping equipment, our platform guarantees accountability:
          </p>
          <ul className="space-y-1.5 list-disc list-inside text-stone-600">
            <li>Strict participant identity verification</li>
            <li>Clear pre-handover equipment condition inspection</li>
            <li>Refundable security deposits held in escrow</li>
            <li>Real verified borrower and lender reviews</li>
          </ul>
        </div>
      </div>

      <div className="bg-emerald-50 rounded-2xl p-6 border border-emerald-200 space-y-3">
        <h3 className="font-bold text-emerald-950">Ready to share your gear?</h3>
        <p className="text-xs text-emerald-800">
          Join hundreds of neighbors in Oakridge Green, Maplewood, and Cedar Heights who are turning idle tools into community assets.
        </p>
        <button
          onClick={() => onNavigate('/list-equipment')}
          className="px-4 py-2 bg-emerald-800 text-white rounded-xl text-xs font-bold hover:bg-emerald-900"
        >
          List Your Equipment Now
        </button>
      </div>
    </div>
  );
};

// -------------------------------------------------------------
// CONTACT PAGE (Working Interactive Form)
// -------------------------------------------------------------
export const ContactPage: React.FC<InfoPageProps> = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('General Inquiry');
  const [message, setMessage] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !message) return;
    setSubmitted(true);
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12 space-y-8">
      <div>
        <h1 className="text-3xl font-extrabold text-stone-900 tracking-tight">
          Contact NeighbourLend Support
        </h1>
        <p className="text-xs sm:text-sm text-stone-500 mt-1">
          Have questions about equipment insurance, security deposits, or starting a neighborhood tool hub? We're here to help.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-4 rounded-xl border border-stone-200 space-y-1">
          <Mail className="w-4 h-4 text-emerald-700" />
          <p className="text-xs font-bold text-stone-900">Email Support</p>
          <p className="text-[11px] text-stone-500">support@neighbourlend.org</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-stone-200 space-y-1">
          <Clock className="w-4 h-4 text-emerald-700" />
          <p className="text-xs font-bold text-stone-900">Response Time</p>
          <p className="text-[11px] text-stone-500">Usually under 4 hours</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-stone-200 space-y-1">
          <MapPin className="w-4 h-4 text-emerald-700" />
          <p className="text-xs font-bold text-stone-900">Community Office</p>
          <p className="text-[11px] text-stone-500">Oakridge Green Sector 4</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-stone-200 p-6 sm:p-8 shadow-xs">
        {submitted ? (
          <div className="text-center py-8 space-y-3">
            <CheckCircle2 className="w-12 h-12 text-emerald-700 mx-auto" />
            <h3 className="text-lg font-bold text-stone-900">Message Received!</h3>
            <p className="text-xs text-stone-500 max-w-sm mx-auto">
              Thank you for contacting us, {name}. A member of our community trustee team will respond to {email} shortly.
            </p>
            <button
              onClick={() => { setSubmitted(false); setMessage(''); }}
              className="text-xs text-emerald-800 font-semibold underline pt-2"
            >
              Send another message
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-stone-800">Your Name *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Your full name"
                  className="w-full px-3 py-2 text-xs bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:border-emerald-600"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-stone-800">Email Address *</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="your.email@example.com"
                  className="w-full px-3 py-2 text-xs bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:border-emerald-600"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-stone-800">Inquiry Topic</label>
              <select
                value={subject}
                onChange={e => setSubject(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:border-emerald-600"
              >
                <option value="General Inquiry">General Marketplace Inquiry</option>
                <option value="Security Deposit">Security Deposit & Payments</option>
                <option value="Equipment Safety">Equipment Safety or Dispute</option>
                <option value="Tool Hub Partnership">Start a Local Tool Library Hub</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-stone-800">Message *</label>
              <textarea
                required
                rows={4}
                value={message}
                onChange={e => setMessage(e.target.value)}
                placeholder="How can our community team assist you?"
                className="w-full px-3 py-2 text-xs bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:border-emerald-600 resize-none"
              />
            </div>

            <button
              type="submit"
              className="px-6 py-2.5 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
            >
              Send Support Inquiry
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

// -------------------------------------------------------------
// FAQ PAGE (Interactive Accordion)
// -------------------------------------------------------------
export const FAQPage: React.FC<InfoPageProps> = () => {
  const [openIdx, setOpenIdx] = useState<number | null>(0);

  const faqs = [
    {
      q: 'How does NeighbourLend protect my equipment from damage or theft?',
      a: 'All members must verify their photo ID and verified phone before submitting borrow requests. When booking, lenders set a refundable security deposit. Furthermore, our pre-handover checklist ensures both parties test and sign off on equipment condition at collection and return.'
    },
    {
      q: 'What is the "Free Community Sharing" option?',
      a: 'NeighbourLend encourages local mutual aid. Lenders can check "Free Community Sharing" to lend items for $0/day (a refundable security deposit may still be applied for protection). This helps keep basic home and garden tools accessible to everyone.'
    },
    {
      q: 'How does the Wishlist and Availability Alerts feature work?',
      a: 'When you find a piece of equipment you want to borrow in the future, click "Add to Wishlist & Notify when Available". If the equipment is currently reserved or paused, our backend will automatically dispatch a notification to your account the moment the owner marks it returned or active again!'
    },
    {
      q: 'Can I cancel a borrow request after submitting?',
      a: 'Yes. While a request is in "Pending" status, the borrower can cancel at any time from their Member Dashboard with zero fees. If already approved, please message the lender promptly to coordinate.'
    },
    {
      q: 'Who pays for fuel, blades, or consumable accessories?',
      a: 'Per our community rules, equipment with gas engines (e.g. pressure washers, tillers) must be returned with the same fuel level as received. For tools requiring consumable blades or sandpaper, lenders specify in the listing description whether consumables are provided or if borrowers must furnish their own.'
    }
  ];

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12 space-y-8">
      <div>
        <h1 className="text-3xl font-extrabold text-stone-900 tracking-tight">
          Frequently Asked Questions
        </h1>
        <p className="text-xs sm:text-sm text-stone-500 mt-1">
          Everything you need to know about borrowing, lending, and safety.
        </p>
      </div>

      <div className="space-y-3">
        {faqs.map((faq, idx) => {
          const isOpen = openIdx === idx;
          return (
            <div key={idx} className="bg-white rounded-2xl border border-stone-200 overflow-hidden">
              <button
                onClick={() => setOpenIdx(isOpen ? null : idx)}
                className="w-full text-left p-4 sm:p-5 flex items-center justify-between gap-4 font-bold text-xs sm:text-sm text-stone-900 hover:bg-stone-50 transition-colors cursor-pointer"
              >
                <span>{faq.q}</span>
                {isOpen ? <ChevronUp className="w-4 h-4 text-emerald-800 shrink-0" /> : <ChevronDown className="w-4 h-4 text-stone-400 shrink-0" />}
              </button>
              {isOpen && (
                <div className="px-5 pb-5 pt-1 text-xs text-stone-600 leading-relaxed border-t border-stone-100">
                  {faq.a}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

// -------------------------------------------------------------
// SAFETY GUIDELINES PAGE
// -------------------------------------------------------------
export const SafetyGuidelinesPage: React.FC<InfoPageProps> = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 space-y-10">
      <div className="space-y-3">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-800 text-xs font-semibold rounded-full border border-emerald-200">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          <span>Community Protection Policy</span>
        </div>
        <h1 className="text-3xl font-extrabold text-stone-900 tracking-tight">
          Equipment Safety & Handover Guidelines
        </h1>
        <p className="text-sm text-stone-600 leading-relaxed">
          The foundation of NeighbourLend is mutual care. Please follow these non-negotiable safety procedures during every rental.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-stone-200 space-y-3">
          <h3 className="font-bold text-stone-900 text-sm flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-700" />
            <span>Pre-Handover Checklist</span>
          </h3>
          <ul className="space-y-2 text-xs text-stone-600 leading-relaxed list-disc list-inside">
            <li>Verify physical member identity matches their NeighbourLend profile.</li>
            <li>Power on the equipment together to confirm motor and blade operation.</li>
            <li>Inspect cables, plugs, hoses, and guards for wear or fraying.</li>
            <li>Take quick timestamped photos of cosmetic condition on pickup.</li>
          </ul>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-stone-200 space-y-3">
          <h3 className="font-bold text-stone-900 text-sm flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600" />
            <span>Operation Safety Protocol</span>
          </h3>
          <ul className="space-y-2 text-xs text-stone-600 leading-relaxed list-disc list-inside">
            <li>Wear ANSI-approved eye protection and sturdy work gloves.</li>
            <li>Read manufacturer operating instructions provided in the listing.</li>
            <li>Disconnect spark plugs or battery packs before adjusting blades or jams.</li>
            <li>Never bypass factory safety switches or protective blade shields.</li>
          </ul>
        </div>
      </div>

      <div className="bg-stone-100 p-6 rounded-2xl border border-stone-200 space-y-2 text-xs text-stone-700">
        <h4 className="font-bold text-stone-900">Security Deposit Dispute Resolution</h4>
        <p>
          If equipment is returned damaged beyond reasonable wear and tear, or if accessories are missing, the owner or borrower should mark the booking "Disputed". Our administrative team reviews photo records from pickup and return to ensure fair deposit allocation.
        </p>
      </div>
    </div>
  );
};

// -------------------------------------------------------------
// TERMS AND CONDITIONS
// -------------------------------------------------------------
export const TermsPage: React.FC<InfoPageProps> = () => {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12 space-y-6 text-stone-700 text-xs sm:text-sm leading-relaxed">
      <h1 className="text-3xl font-extrabold text-stone-900 tracking-tight">Terms and Conditions</h1>
      <p className="text-stone-500 text-xs">Last updated: March 2026</p>

      <section className="space-y-2">
        <h2 className="font-bold text-stone-900 text-sm uppercase tracking-wide">1. Acceptance of Community Agreement</h2>
        <p>
          By creating an account or using NeighbourLend, you agree to comply with all community lending rules, verified profile guidelines, and deposit requirements.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="font-bold text-stone-900 text-sm uppercase tracking-wide">2. Equipment Ownership & Warranties</h2>
        <p>
          Lenders warrant that they own or have full legal authority to share listed equipment and that equipment is in safe, operational condition. Borrowers agree to exercise reasonable care and operate equipment solely for its intended purpose.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="font-bold text-stone-900 text-sm uppercase tracking-wide">3. Security Deposits & Payments</h2>
        <p>
          Where monetary transactions apply, security deposits are held in escrow and released upon prompt inspection and return. Direct peer handovers must adhere to transparent local verification.
        </p>
      </section>
    </div>
  );
};

// -------------------------------------------------------------
// PRIVACY POLICY
// -------------------------------------------------------------
export const PrivacyPolicyPage: React.FC<InfoPageProps> = () => {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12 space-y-6 text-stone-700 text-xs sm:text-sm leading-relaxed">
      <h1 className="text-3xl font-extrabold text-stone-900 tracking-tight">Privacy Policy</h1>
      <p className="text-stone-500 text-xs">Last updated: March 2026</p>

      <section className="space-y-2">
        <h2 className="font-bold text-stone-900 text-sm uppercase tracking-wide">1. Member Data Protection</h2>
        <p>
          NeighbourLend respects your privacy. We collect only necessary contact and neighborhood data (full name, email, verified phone, and neighborhood district) required to facilitate safe peer-to-peer equipment sharing.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="font-bold text-stone-900 text-sm uppercase tracking-wide">2. Private Messaging & Location Privacy</h2>
        <p>
          Your exact home address is never displayed publicly on marketplace search cards. Pickup instructions and exact street addresses are revealed only to confirmed booking participants.
        </p>
      </section>
    </div>
  );
};

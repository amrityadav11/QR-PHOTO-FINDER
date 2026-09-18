import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Camera, QrCode, Zap, Download, Shield, Users, Star,
  ChevronDown, ChevronUp, Check, ArrowRight, Menu, X,
  Image, Search, Heart, Briefcase, GraduationCap, Music,
  Trophy, Globe, Lock
} from 'lucide-react';

// ─── Navbar ────────────────────────────────────────────────────────────────────
const Navbar = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 gradient-primary rounded-lg flex items-center justify-center">
              <QrCode className="w-4 h-4 text-white" />
            </div>
            <span className="text-lg font-bold text-gray-900">SnapFind</span>
          </div>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-8">
            <a href="#how-it-works" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">How it Works</a>
            <a href="#features" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">Features</a>
            <a href="#pricing" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">Pricing</a>
            <a href="#faq" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">FAQ</a>
          </div>

          {/* CTA */}
          <div className="hidden md:flex items-center gap-3">
            <Link to="/login" className="btn-ghost text-sm">Log in</Link>
            <Link to="/register" className="btn-primary text-sm">Get Started Free</Link>
          </div>

          {/* Mobile toggle */}
          <button className="md:hidden p-2 text-gray-600" onClick={() => setMenuOpen(!menuOpen)} aria-label="Toggle menu">
            {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden border-t border-gray-100 bg-white px-4 py-4 space-y-3 animate-slide-up">
          <a href="#how-it-works" className="block text-sm text-gray-700 py-2" onClick={() => setMenuOpen(false)}>How it Works</a>
          <a href="#features" className="block text-sm text-gray-700 py-2" onClick={() => setMenuOpen(false)}>Features</a>
          <a href="#pricing" className="block text-sm text-gray-700 py-2" onClick={() => setMenuOpen(false)}>Pricing</a>
          <a href="#faq" className="block text-sm text-gray-700 py-2" onClick={() => setMenuOpen(false)}>FAQ</a>
          <div className="pt-2 border-t border-gray-100 flex flex-col gap-2">
            <Link to="/login" className="btn-secondary w-full justify-center text-sm">Log in</Link>
            <Link to="/register" className="btn-primary w-full justify-center text-sm">Get Started Free</Link>
          </div>
        </div>
      )}
    </nav>
  );
};

// ─── Hero ──────────────────────────────────────────────────────────────────────
const Hero = () => (
  <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-violet-50 via-white to-white overflow-hidden">
    <div className="max-w-7xl mx-auto">
      <div className="text-center max-w-4xl mx-auto mb-16">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-violet-100 text-violet-700 rounded-full text-sm font-medium mb-6">
          <Zap className="w-3.5 h-3.5" />
          AI-powered face matching for event photos
        </div>
        <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold text-gray-900 tracking-tight leading-tight mb-6">
          Find Your Event<br />
          <span className="gradient-text">Photos With One Selfie</span>
        </h1>
        <p className="text-xl text-gray-500 max-w-2xl mx-auto mb-10">
          Scan the QR code, take a selfie, and instantly discover every photo you appear in — from weddings to conferences, festivals to birthdays.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link to="/register" className="btn-primary text-base px-8 py-3.5 shadow-lg shadow-violet-200">
            Create Your Event <ArrowRight className="w-4 h-4" />
          </Link>
          <a href="#how-it-works" className="btn-secondary text-base px-8 py-3.5">
            See How it Works
          </a>
        </div>
        <p className="text-xs text-gray-400 mt-4">Free plan available · No credit card required</p>
      </div>

      {/* Hero visual */}
      <div className="relative max-w-5xl mx-auto">
        <div className="bg-white rounded-3xl border border-gray-200 shadow-2xl overflow-hidden p-8">
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-8">
            {/* Step 1 */}
            <div className="flex flex-col items-center gap-3 text-center">
              <div className="w-16 h-16 bg-violet-100 rounded-2xl flex items-center justify-center">
                <Camera className="w-8 h-8 text-violet-600" />
              </div>
              <div>
                <p className="font-semibold text-gray-900 text-sm">Photographer</p>
                <p className="text-xs text-gray-500">Uploads photos</p>
              </div>
            </div>

            <div className="text-gray-300 text-2xl hidden sm:block">→</div>

            {/* Step 2 */}
            <div className="flex flex-col items-center gap-3 text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center">
                <QrCode className="w-8 h-8 text-blue-600" />
              </div>
              <div>
                <p className="font-semibold text-gray-900 text-sm">QR Code</p>
                <p className="text-xs text-gray-500">Displayed at event</p>
              </div>
            </div>

            <div className="text-gray-300 text-2xl hidden sm:block">→</div>

            {/* Step 3 */}
            <div className="flex flex-col items-center gap-3 text-center">
              <div className="w-16 h-16 bg-pink-100 rounded-2xl flex items-center justify-center">
                <Search className="w-8 h-8 text-pink-600" />
              </div>
              <div>
                <p className="font-semibold text-gray-900 text-sm">Guest Selfie</p>
                <p className="text-xs text-gray-500">One photo, instant match</p>
              </div>
            </div>

            <div className="text-gray-300 text-2xl hidden sm:block">→</div>

            {/* Step 4 */}
            <div className="flex flex-col items-center gap-3 text-center">
              <div className="w-16 h-16 bg-emerald-100 rounded-2xl flex items-center justify-center">
                <Image className="w-8 h-8 text-emerald-600" />
              </div>
              <div>
                <p className="font-semibold text-gray-900 text-sm">Your Photos</p>
                <p className="text-xs text-gray-500">Found instantly</p>
              </div>
            </div>
          </div>

          {/* Mock result bar */}
          <div className="mt-8 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3 flex items-center gap-3 max-w-sm mx-auto">
            <div className="w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center flex-shrink-0">
              <Check className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="text-sm font-semibold text-emerald-800">37 photos found!</p>
              <p className="text-xs text-emerald-600">AI matched your face in 2.3 seconds</p>
            </div>
          </div>
        </div>

        {/* Floating badges */}
        <div className="absolute -top-4 -right-4 bg-white border border-gray-100 rounded-2xl px-4 py-2 shadow-lg hidden lg:flex items-center gap-2">
          <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
          <span className="text-sm font-semibold text-gray-900">4.9/5 rating</span>
        </div>
        <div className="absolute -bottom-4 -left-4 bg-white border border-gray-100 rounded-2xl px-4 py-2 shadow-lg hidden lg:flex items-center gap-2">
          <Users className="w-4 h-4 text-violet-600" />
          <span className="text-sm font-semibold text-gray-900">10k+ events hosted</span>
        </div>
      </div>
    </div>
  </section>
);

// ─── How It Works ─────────────────────────────────────────────────────────────
const HowItWorks = () => {
  const steps = [
    {
      num: '01',
      icon: Camera,
      title: 'Upload Photos',
      desc: 'Photographers upload their entire event gallery. Our AI processes every photo in the background — detecting and indexing all faces automatically.',
      color: 'text-violet-600 bg-violet-50',
    },
    {
      num: '02',
      icon: QrCode,
      title: 'Share QR Code',
      desc: 'A unique QR code is generated for your event. Print it, display it on a screen, or share it digitally. Guests scan it with any smartphone.',
      color: 'text-blue-600 bg-blue-50',
    },
    {
      num: '03',
      icon: Camera,
      title: 'Guest Takes Selfie',
      desc: 'Guests scan the QR code, accept the privacy notice, and take a quick selfie using their phone camera or upload one from their gallery.',
      color: 'text-pink-600 bg-pink-50',
    },
    {
      num: '04',
      icon: Image,
      title: 'Get Your Photos',
      desc: 'Our AI instantly finds all photos containing the guest\'s face. They can view, download, and share their photos directly from the gallery.',
      color: 'text-emerald-600 bg-emerald-50',
    },
  ];

  return (
    <section id="how-it-works" className="py-24 px-4 sm:px-6 lg:px-8 bg-white">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <p className="text-sm font-semibold text-violet-600 uppercase tracking-wider mb-3">How it works</p>
          <h2 className="section-title mb-4">Simple for photographers.<br />Magical for guests.</h2>
          <p className="section-subtitle">Four steps from upload to download — no app install required.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((step, i) => (
            <div key={i} className="relative">
              {i < steps.length - 1 && (
                <div className="hidden lg:block absolute top-8 left-full w-full h-px bg-gradient-to-r from-gray-200 to-transparent z-0 -translate-x-4" />
              )}
              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-4xl font-black text-gray-100">{step.num}</span>
                  <div className={`p-3 rounded-xl ${step.color}`}>
                    <step.icon className="w-5 h-5" />
                  </div>
                </div>
                <h3 className="font-bold text-gray-900 text-lg mb-2">{step.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{step.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

// ─── Features ─────────────────────────────────────────────────────────────────
const Features = () => {
  const features = [
    { icon: Zap, title: 'Instant AI Matching', desc: 'Face embeddings compared in milliseconds. Thousands of photos searched in seconds, not minutes.', color: 'text-violet-600 bg-violet-50' },
    { icon: Shield, title: 'Privacy First', desc: 'Selfies are never stored permanently. Face embeddings stay server-side. Explicit consent required before processing.', color: 'text-emerald-600 bg-emerald-50' },
    { icon: QrCode, title: 'Zero App Install', desc: 'Guests just scan a QR code. No app download, no account creation — it just works in any mobile browser.', color: 'text-blue-600 bg-blue-50' },
    { icon: Download, title: 'Flexible Downloads', desc: 'Configure per-event download permissions. Support for original resolution or optimised preview downloads.', color: 'text-amber-600 bg-amber-50' },
    { icon: Globe, title: 'Works Everywhere', desc: 'Optimised for mobile Safari and Chrome. QR scanning, camera access, and galleries all work seamlessly on any device.', color: 'text-pink-600 bg-pink-50' },
    { icon: Lock, title: 'Enterprise Security', desc: 'Rate limiting, file validation, authenticated APIs, signed URLs. Your data and your clients\' privacy are protected.', color: 'text-red-600 bg-red-50' },
  ];

  return (
    <section id="features" className="py-24 px-4 sm:px-6 lg:px-8 bg-gray-50">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <p className="text-sm font-semibold text-violet-600 uppercase tracking-wider mb-3">Features</p>
          <h2 className="section-title mb-4">Everything you need.<br />Nothing you don't.</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((f, i) => (
            <div key={i} className="card p-6 hover:shadow-card-hover transition-shadow">
              <div className={`p-3 rounded-xl ${f.color} w-fit mb-4`}>
                <f.icon className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-gray-900 mb-2">{f.title}</h3>
              <p className="text-gray-500 text-sm leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

// ─── Use Cases ────────────────────────────────────────────────────────────────
const UseCases = () => {
  const cases = [
    { icon: Heart, label: 'Weddings & Engagements', color: 'text-pink-500 bg-pink-50' },
    { icon: GraduationCap, label: 'College Events', color: 'text-blue-500 bg-blue-50' },
    { icon: Briefcase, label: 'Corporate & Conferences', color: 'text-gray-600 bg-gray-100' },
    { icon: Music, label: 'Festivals & Concerts', color: 'text-violet-500 bg-violet-50' },
    { icon: Trophy, label: 'Sports Events', color: 'text-amber-500 bg-amber-50' },
    { icon: Camera, label: 'Photography Events', color: 'text-emerald-500 bg-emerald-50' },
  ];

  return (
    <section className="py-24 px-4 sm:px-6 lg:px-8 bg-white">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <p className="text-sm font-semibold text-violet-600 uppercase tracking-wider mb-3">Use Cases</p>
          <h2 className="section-title mb-4">Perfect for any event</h2>
          <p className="section-subtitle">If there's a camera and a crowd, SnapFind makes finding photos effortless.</p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {cases.map((c, i) => (
            <div key={i} className="flex flex-col items-center gap-3 p-4 rounded-2xl hover:bg-gray-50 transition-colors cursor-default text-center">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${c.color}`}>
                <c.icon className="w-6 h-6" />
              </div>
              <span className="text-sm font-medium text-gray-700">{c.label}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

// ─── Pricing ──────────────────────────────────────────────────────────────────
const Pricing = () => {
  const plans = [
    {
      name: 'Free',
      price: '$0',
      period: 'forever',
      desc: 'Perfect for trying it out',
      features: ['100 photos per event', '5 events total', 'QR code generation', 'Guest gallery', 'Basic support'],
      cta: 'Get Started Free',
      highlighted: false,
    },
    {
      name: 'Starter',
      price: '$29',
      period: 'per month',
      desc: 'For occasional photographers',
      features: ['1,000 photos per event', '20 events per month', 'AI face matching', 'Guest downloads', 'Priority support'],
      cta: 'Start Free Trial',
      highlighted: false,
    },
    {
      name: 'Pro',
      price: '$79',
      period: 'per month',
      desc: 'For professional photographers',
      features: ['5,000 photos per event', 'Unlimited events', 'Advanced analytics', 'HD downloads', 'Priority processing', 'Custom watermark'],
      cta: 'Start Free Trial',
      highlighted: true,
      badge: 'Most Popular',
    },
    {
      name: 'Business',
      price: '$199',
      period: 'per month',
      desc: 'For agencies & enterprises',
      features: ['20,000+ photos per event', 'Unlimited everything', 'White-label options', 'API access', 'Dedicated support', 'SLA guarantee'],
      cta: 'Contact Sales',
      highlighted: false,
    },
  ];

  return (
    <section id="pricing" className="py-24 px-4 sm:px-6 lg:px-8 bg-gray-50">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <p className="text-sm font-semibold text-violet-600 uppercase tracking-wider mb-3">Pricing</p>
          <h2 className="section-title mb-4">Simple, transparent pricing</h2>
          <p className="section-subtitle">Start free, scale as you grow. No hidden fees.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {plans.map((plan, i) => (
            <div
              key={i}
              className={`relative rounded-2xl p-6 flex flex-col ${
                plan.highlighted
                  ? 'bg-violet-600 text-white shadow-2xl shadow-violet-200 scale-105'
                  : 'bg-white border border-gray-200'
              }`}
            >
              {plan.badge && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-amber-400 text-amber-900 text-xs font-bold px-3 py-1 rounded-full">
                  {plan.badge}
                </div>
              )}

              <div className="mb-6">
                <p className={`font-bold text-lg mb-1 ${plan.highlighted ? 'text-white' : 'text-gray-900'}`}>{plan.name}</p>
                <div className="flex items-end gap-1 mb-2">
                  <span className={`text-4xl font-extrabold ${plan.highlighted ? 'text-white' : 'text-gray-900'}`}>{plan.price}</span>
                  <span className={`text-sm mb-1 ${plan.highlighted ? 'text-violet-200' : 'text-gray-500'}`}>/{plan.period}</span>
                </div>
                <p className={`text-sm ${plan.highlighted ? 'text-violet-200' : 'text-gray-500'}`}>{plan.desc}</p>
              </div>

              <ul className="space-y-3 mb-8 flex-1">
                {plan.features.map((f, j) => (
                  <li key={j} className="flex items-center gap-2.5 text-sm">
                    <div className={`w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 ${plan.highlighted ? 'bg-violet-500' : 'bg-violet-50'}`}>
                      <Check className={`w-2.5 h-2.5 ${plan.highlighted ? 'text-white' : 'text-violet-600'}`} />
                    </div>
                    <span className={plan.highlighted ? 'text-violet-100' : 'text-gray-600'}>{f}</span>
                  </li>
                ))}
              </ul>

              <Link
                to="/register"
                className={`w-full text-center py-3 rounded-xl font-semibold text-sm transition-all ${
                  plan.highlighted
                    ? 'bg-white text-violet-600 hover:bg-violet-50'
                    : 'bg-violet-600 text-white hover:bg-violet-700'
                }`}
              >
                {plan.cta}
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

// ─── Privacy Section ──────────────────────────────────────────────────────────
const PrivacySection = () => (
  <section className="py-24 px-4 sm:px-6 lg:px-8 bg-white">
    <div className="max-w-4xl mx-auto">
      <div className="bg-gradient-to-br from-violet-50 to-blue-50 rounded-3xl p-10 border border-violet-100">
        <div className="flex flex-col lg:flex-row gap-8 items-start">
          <div className="flex-shrink-0">
            <div className="w-16 h-16 bg-white rounded-2xl shadow-sm flex items-center justify-center">
              <Shield className="w-8 h-8 text-violet-600" />
            </div>
          </div>
          <div>
            <p className="text-sm font-semibold text-violet-600 uppercase tracking-wider mb-2">Privacy & Security</p>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">We take biometric data seriously</h2>
            <div className="space-y-3">
              {[
                'Explicit consent required before any selfie is processed',
                'Selfies are never stored permanently — deleted immediately after matching',
                'Face embeddings stay server-side and are never exposed to guests',
                'All storage uses signed URLs — no direct credential exposure',
                'Rate limiting prevents abuse of the face search system',
                'Photographers control event expiry, visibility, and download permissions',
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-violet-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Check className="w-3 h-3 text-violet-600" />
                  </div>
                  <p className="text-gray-600 text-sm">{item}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
);

// ─── FAQ ──────────────────────────────────────────────────────────────────────
const FAQ = () => {
  const [open, setOpen] = useState(null);

  const faqs = [
    { q: 'Do guests need to create an account?', a: 'No. Guests simply scan the QR code, take a selfie, and get their photos. No account, no app install, no friction.' },
    { q: 'How accurate is the face matching?', a: 'Very accurate. We use AWS Rekognition or Face++ under the hood — the same AI used by enterprise identity systems. The similarity threshold is configurable per event.' },
    { q: 'Are selfies stored?', a: 'No. Selfies exist only in memory during processing and are never written to disk or storage. Only the derived face embeddings are stored, server-side only.' },
    { q: 'How many photos can I upload?', a: 'It depends on your plan. Free plans support 100 photos per event. Pro plans handle 5,000+. Business plans can go up to 20,000+ photos per event.' },
    { q: 'What file formats are supported?', a: 'JPG, JPEG, PNG, and WEBP are all supported. Maximum file size is 20MB per photo by default.' },
    { q: 'Can I customise the event settings?', a: 'Yes. Each event has configurable settings: allow/disable downloads, enable original resolution, add watermarks, set expiry dates, control gallery visibility, and adjust face similarity thresholds.' },
    { q: 'What happens when the event expires?', a: 'Expired events become inaccessible to guests. Photographers can still view and manage them from the dashboard, and can manually delete all data at any time.' },
    { q: 'Can I use this on mobile?', a: 'Yes — the guest experience is fully optimised for mobile. Camera access, QR scanning, gallery viewing, and downloads all work on iOS Safari and Android Chrome.' },
  ];

  return (
    <section id="faq" className="py-24 px-4 sm:px-6 lg:px-8 bg-gray-50">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-12">
          <p className="text-sm font-semibold text-violet-600 uppercase tracking-wider mb-3">FAQ</p>
          <h2 className="section-title">Common questions</h2>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, i) => (
            <div key={i} className="card overflow-hidden">
              <button
                className="w-full flex items-center justify-between px-6 py-4 text-left"
                onClick={() => setOpen(open === i ? null : i)}
                aria-expanded={open === i}
              >
                <span className="font-medium text-gray-900 text-sm pr-4">{faq.q}</span>
                {open === i
                  ? <ChevronUp className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  : <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0" />
                }
              </button>
              {open === i && (
                <div className="px-6 pb-4 animate-fade-in">
                  <p className="text-sm text-gray-500 leading-relaxed">{faq.a}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

// ─── CTA ──────────────────────────────────────────────────────────────────────
const CTA = () => (
  <section className="py-24 px-4 sm:px-6 lg:px-8 bg-white">
    <div className="max-w-4xl mx-auto text-center">
      <div className="gradient-primary rounded-3xl p-12 text-white">
        <h2 className="text-3xl sm:text-4xl font-extrabold mb-4">Ready to wow your guests?</h2>
        <p className="text-violet-200 text-lg mb-8 max-w-xl mx-auto">
          Create your first event in under 2 minutes. Free forever, upgrade when you're ready.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link to="/register" className="inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-white text-violet-600 font-semibold rounded-xl hover:bg-violet-50 transition-colors shadow-lg">
            Create Your Event <ArrowRight className="w-4 h-4" />
          </Link>
          <Link to="/login" className="inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-violet-500/30 text-white font-semibold rounded-xl hover:bg-violet-500/50 transition-colors border border-violet-400/30">
            Sign In
          </Link>
        </div>
      </div>
    </div>
  </section>
);

// ─── Footer ───────────────────────────────────────────────────────────────────
const Footer = () => (
  <footer className="bg-gray-900 text-gray-400 py-12 px-4 sm:px-6 lg:px-8">
    <div className="max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between gap-8 mb-8">
        <div>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-7 h-7 gradient-primary rounded-lg flex items-center justify-center">
              <QrCode className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="text-white font-bold">SnapFind</span>
          </div>
          <p className="text-sm max-w-xs">AI-powered photo discovery for events of all sizes.</p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-8">
          <div>
            <p className="text-white text-sm font-semibold mb-3">Product</p>
            <ul className="space-y-2 text-sm">
              <li><a href="#how-it-works" className="hover:text-white transition-colors">How it Works</a></li>
              <li><a href="#features" className="hover:text-white transition-colors">Features</a></li>
              <li><a href="#pricing" className="hover:text-white transition-colors">Pricing</a></li>
            </ul>
          </div>
          <div>
            <p className="text-white text-sm font-semibold mb-3">Account</p>
            <ul className="space-y-2 text-sm">
              <li><Link to="/register" className="hover:text-white transition-colors">Sign Up</Link></li>
              <li><Link to="/login" className="hover:text-white transition-colors">Log In</Link></li>
              <li><Link to="/dashboard" className="hover:text-white transition-colors">Dashboard</Link></li>
            </ul>
          </div>
          <div>
            <p className="text-white text-sm font-semibold mb-3">Legal</p>
            <ul className="space-y-2 text-sm">
              <li><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Terms of Service</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Cookie Policy</a></li>
            </ul>
          </div>
        </div>
      </div>

      <div className="border-t border-gray-800 pt-6 flex flex-col sm:flex-row justify-between items-center gap-2 text-xs">
        <p>© {new Date().getFullYear()} SnapFind. All rights reserved.</p>
        <p>Built with privacy and security as first-class features.</p>
      </div>
    </div>
  </footer>
);

// ─── Main export ──────────────────────────────────────────────────────────────
const LandingPage = () => (
  <div className="min-h-screen">
    <Navbar />
    <Hero />
    <HowItWorks />
    <Features />
    <UseCases />
    <PrivacySection />
    <Pricing />
    <FAQ />
    <CTA />
    <Footer />
  </div>
);

export default LandingPage;

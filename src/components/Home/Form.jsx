import React, { useRef, useState } from "react";
import emailjs from "@emailjs/browser";
import { Send, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";

export default function Form({ showStrip, setStripText }) {
  const [submitting, setSubmitting] = useState(false);
  const [submittedSuccess, setSubmittedSuccess] = useState(false);

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    subject: "",
    message: "",
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const form = useRef();

  const sendEmail = (e) => {
    e.preventDefault();

    if (
      !formData.firstName ||
      !formData.email ||
      !formData.message ||
      !formData.phone ||
      !formData.subject
    ) {
      alert("Please fill all the required fields");
      return;
    }

    if (formData.phone.length < 10) {
      alert("Please enter a valid phone number");
      return;
    }

    setSubmitting(true);

    emailjs
      .sendForm(
        "service_sw8ehgj",
        "template_ls82fgr",
        form.current,
        "8ZriNqr0I8M9ftNbI"
      )
      .then(
        () => {
          setSubmitting(false);
          setSubmittedSuccess(true);
          if (showStrip) showStrip();
          if (setStripText) setStripText("Form submitted successfully!");
          setFormData({
            firstName: "",
            lastName: "",
            email: "",
            phone: "",
            subject: "",
            message: "",
          });
          setTimeout(() => setSubmittedSuccess(false), 5000);
        },
        (error) => {
          console.error(error);
          setSubmitting(false);
          if (setStripText) setStripText("Something went wrong. Please try again later");
          if (showStrip) showStrip();
        }
      );
  };

  return (
    <div
      id="contact"
      className="w-full rounded-3xl bg-slate-900/60 border border-amber-500/20 hover:border-amber-500/40 p-6 sm:p-8 backdrop-blur-xl shadow-2xl transition-all duration-500 relative overflow-hidden"
    >
      {/* Subtle Top Gradient Accent */}
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-amber-500/40 to-transparent" />

      {/* Card Header */}
      <div className="flex items-center justify-between mb-6 pb-3 border-b border-slate-800">
        <div>
          <h3 className="text-xl sm:text-2xl font-bold text-white">
            Send Us a Message
          </h3>
          <p className="text-xs text-slate-400 font-sans mt-0.5">
            Fill out the form and our team will get back to you within 24 hours.
          </p>
        </div>
        <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse shadow-[0_0_10px_rgba(245,158,11,0.8)]" />
      </div>

      <form ref={form} onSubmit={sendEmail} className="space-y-4 font-sans text-sm">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* First Name */}
          <div className="space-y-1.5">
            <label htmlFor="firstName" className="block text-xs font-mono text-slate-300 uppercase tracking-wider">
              First Name <span className="text-amber-400">*</span>
            </label>
            <input
              type="text"
              name="firstName"
              id="firstName"
              required
              placeholder="Yourname"
              className="w-full rounded-xl bg-black/50 border border-slate-800 focus:border-amber-400 text-slate-100 placeholder-slate-600 px-4 py-3 text-base sm:text-sm outline-none transition-all focus:ring-1 focus:ring-amber-400/50"
              onChange={handleChange}
              value={formData.firstName}
            />
          </div>

          {/* Last Name */}
          <div className="space-y-1.5">
            <label htmlFor="lastName" className="block text-xs font-mono text-slate-300 uppercase tracking-wider">
              Last Name
            </label>
            <input
              type="text"
              name="lastName"
              id="lastName"
              placeholder=""
              className="w-full rounded-xl bg-black/50 border border-slate-800 focus:border-amber-400 text-slate-100 placeholder-slate-600 px-4 py-3 text-base sm:text-sm outline-none transition-all focus:ring-1 focus:ring-amber-400/50"
              onChange={handleChange}
              value={formData.lastName}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Email */}
          <div className="space-y-1.5">
            <label htmlFor="email" className="block text-xs font-mono text-slate-300 uppercase tracking-wider">
              Email Address <span className="text-amber-400">*</span>
            </label>
            <input
              type="email"
              name="email"
              id="email"
              required
              placeholder="@gmail.com"
              className="w-full rounded-xl bg-black/50 border border-slate-800 focus:border-amber-400 text-slate-100 placeholder-slate-600 px-4 py-3 text-base sm:text-sm outline-none transition-all focus:ring-1 focus:ring-amber-400/50"
              onChange={handleChange}
              value={formData.email}
            />
          </div>

          {/* Phone */}
          <div className="space-y-1.5">
            <label htmlFor="phone" className="block text-xs font-mono text-slate-300 uppercase tracking-wider">
              Phone Number <span className="text-amber-400">*</span>
            </label>
            <input
              type="tel"
              name="phone"
              id="phone"
              required
              placeholder=""
              className="w-full rounded-xl bg-black/50 border border-slate-800 focus:border-amber-400 text-slate-100 placeholder-slate-600 px-4 py-3 text-base sm:text-sm outline-none transition-all focus:ring-1 focus:ring-amber-400/50"
              onChange={handleChange}
              value={formData.phone}
            />
          </div>
        </div>

        {/* Subject */}
        <div className="space-y-1.5">
          <label htmlFor="subject" className="block text-xs font-mono text-slate-300 uppercase tracking-wider">
            Subject / Inquiry Type <span className="text-amber-400">*</span>
          </label>
          <input
            type="text"
            name="subject"
            id="subject"
            required
            placeholder="Sponsorship / Partnership / Event Query"
            className="w-full rounded-xl bg-black/50 border border-slate-800 focus:border-amber-400 text-slate-100 placeholder-slate-600 px-4 py-3 text-base sm:text-sm outline-none transition-all focus:ring-1 focus:ring-amber-400/50"
            onChange={handleChange}
            value={formData.subject}
          />
        </div>

        {/* Message */}
        <div className="space-y-1.5">
          <label htmlFor="message" className="block text-xs font-mono text-slate-300 uppercase tracking-wider">
            Message <span className="text-amber-400">*</span>
          </label>
          <textarea
            rows={4}
            name="message"
            id="message"
            required
            placeholder="Tell us about your proposal or message..."
            className="w-full rounded-xl bg-black/50 border border-slate-800 focus:border-amber-400 text-slate-100 placeholder-slate-600 px-4 py-3 text-base sm:text-sm outline-none transition-all focus:ring-1 focus:ring-amber-400/50"
            onChange={handleChange}
            value={formData.message}
          />
        </div>

        {/* Submit Button */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={submitting}
            className="w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-gradient-to-r from-amber-500 via-amber-400 to-gold text-slate-950 font-bold text-sm shadow-lg hover:shadow-[0_0_25px_rgba(245,158,11,0.4)] hover:scale-[1.01] active:scale-[0.99] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
                <span>Sending Message...</span>
              </>
            ) : (
              <>
                <Send className="w-4 h-4 text-slate-950" />
                <span>Send Message</span>
              </>
            )}
          </button>
        </div>

        {submittedSuccess && (
          <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 font-mono text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Message sent successfully! We will get back to you soon.</span>
          </div>
        )}
      </form>
    </div>
  );
}
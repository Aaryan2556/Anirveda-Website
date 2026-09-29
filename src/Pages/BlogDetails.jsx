import React from "react";
import { useParams, Link } from "react-router-dom";
import blogData from "../data/blogs";
import Navbar from "../components/Navbar";
import ContactUs from "../components/ContactUs";
import AnnouncementBar from "../components/AnnouncementBar";
import { Clock, Calendar, User, ArrowLeft, BookOpen, PenTool } from "lucide-react";

const BlogDetails = () => {
  const { id } = useParams();
  const blog = blogData.find((b) => b.id === Number(id));

  if (!blog) {
    return (
      <div className="min-h-screen bg-background text-foreground flex flex-col justify-between font-sans">
        <AnnouncementBar />
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center p-8 font-mono text-muted-foreground">
          <h2 className="text-2xl text-primary mb-4 font-Bebas">DOSSIER NOT FOUND</h2>
          <p className="text-sm mb-6">The requested publication ID could not be retrieved from the telemetry index.</p>
          <Link
            to="/blogs"
            className="px-6 py-2.5 rounded-xl bg-primary text-primary-foreground text-xs font-bold uppercase tracking-wider flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Publications</span>
          </Link>
        </div>
        <ContactUs />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground font-sans relative select-none">
      {/* Site Header Navigation */}
      <AnnouncementBar />
      <Navbar />

      {/* Main Container */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-12">
        {/* Breadcrumb Navigation */}
        <div className="flex items-center gap-2 font-mono text-xs text-muted-foreground mb-8">
          <Link to="/blogs" className="text-primary hover:text-accent flex items-center gap-1 transition-colors">
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>RESEARCH TERMINAL</span>
          </Link>
          <span>/</span>
          <span className="uppercase text-secondary">{blog.categoryLabel || "DOSSIER"}</span>
        </div>

        {/* Title */}
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-Bebas text-primary mb-6 leading-none drop-shadow-[0_0_30px_rgba(var(--primary-rgb),0.3)]">
          {blog.title}
        </h1>

        {/* Metadata Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-y border-border py-4 mb-8 font-mono text-xs text-muted-foreground">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-primary" />
              <span className="text-foreground font-bold">{blog.author}</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-secondary" />
              <span>{blog.date}</span>
            </div>
            {blog.readTime && (
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-accent" />
                <span className="text-accent font-bold">{blog.readTime}</span>
              </div>
            )}
          </div>

          <div className="px-3 py-1 rounded-full bg-card border border-border text-primary text-[10px] font-bold tracking-widest">
            {blog.authorNode || "NODE_RESEARCH"}
          </div>
        </div>

        {/* Hero Image */}
        <div className="rounded-2xl overflow-hidden border border-border shadow-2xl mb-10 bg-card p-2">
          <img
            src={blog.image}
            alt={blog.title}
            className="w-full h-[320px] sm:h-[420px] object-cover rounded-xl"
          />
        </div>

        {/* Article Body */}
        <article className="bg-card border border-border rounded-2xl p-6 sm:p-10 md:p-12 mb-12 shadow-xl">
          {/* Excerpt Intro */}
          <p className="text-lg sm:text-xl text-secondary italic mb-8 leading-relaxed font-sans border-l-2 border-primary pl-4">
            {blog.excerpt}
          </p>

          {/* HTML Content */}
          <div
            className="space-y-6 text-foreground/90 leading-relaxed font-sans text-base sm:text-lg"
            dangerouslySetInnerHTML={{ __html: blog.content }}
          />
        </article>

        {/* Author Metadata Box */}
        <div className="bg-card border border-border rounded-2xl p-6 sm:p-8 mb-12 flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="p-3 rounded-xl bg-primary text-primary-foreground">
            <PenTool className="w-6 h-6 text-accent" />
          </div>
          <div>
            <h3 className="font-Bebas text-2xl text-foreground tracking-wide mb-1">
              ABOUT THE RESEARCH NODE // {blog.author}
            </h3>
            <p className="font-sans text-xs sm:text-sm text-muted-foreground leading-relaxed">
              The Anirveda Research & Content team produces deep macroeconomic telemetry, quantitative fintech analyses, and technological policy benchmarks shaping the future of global markets.
            </p>
          </div>
        </div>

        {/* Related Articles */}
        <div className="pt-8 border-t border-border">
          <div className="flex items-center gap-2 font-mono text-xs font-bold text-muted-foreground uppercase tracking-widest mb-6">
            <BookOpen className="w-4 h-4 text-primary" />
            <span>RELATED RESEARCH DOSSIERS</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {blogData
              .filter((item) => item.id !== blog.id)
              .slice(0, 3)
              .map((item) => (
                <Link
                  key={item.id}
                  to={`/blogs/${item.id}`}
                  className="group bg-card border border-border rounded-2xl overflow-hidden hover:border-primary/60 hover:shadow-xl transition-all duration-300 flex flex-col justify-between"
                >
                  <div className="h-40 w-full overflow-hidden bg-muted/40 p-1">
                    <img
                      src={item.image}
                      alt={item.title}
                      className="w-full h-full object-cover rounded-xl transition-transform duration-500 group-hover:scale-105"
                    />
                  </div>

                  <div className="p-5 flex-1 flex flex-col justify-between">
                    <div>
                      <span className="font-mono text-[10px] text-accent font-bold block mb-1">
                        {item.categoryLabel || "RESEARCH"}
                      </span>
                      <h4 className="font-Bebas text-2xl text-foreground group-hover:text-primary transition-colors leading-tight mb-2">
                        {item.title}
                      </h4>
                      <p className="font-sans text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                        {item.excerpt}
                      </p>
                    </div>

                    <div className="pt-3 mt-3 border-t border-border/80 font-mono text-[10px] text-primary font-bold flex items-center justify-between">
                      <span>READ DOSSIER</span>
                      <span>→</span>
                    </div>
                  </div>
                </Link>
              ))}
          </div>
        </div>
      </main>

      {/* Footer */}
      <ContactUs />
    </div>
  );
};

export default BlogDetails;

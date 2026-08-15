import { Home, ArrowLeft, Search } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import SEOHead from '../../components/seo/SEOHead';
import { useSettings } from '../../store/useSettings';

const ACCENT = '#f59e0b';

export default function NotFoundPage() {
  const { t } = useTranslation();
  const { getSetting } = useSettings();
  const storeName = getSetting('storeName', 'Krishna Store');

  return (
    <div className="flex-1 flex items-center justify-center min-h-[80vh] px-4 py-16" 
      style={{ background: '#0f0f0f' }}
    >
      <SEOHead
        title={`Page Not Found | ${storeName}`}
        description={`The page you're looking for doesn't exist or has been moved. Browse our collection of premium products at ${storeName}.`}
        noIndex={true}
      />

      {/* Subtle background orbs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="absolute top-[-15%] left-[-5%] w-[50%] h-[50%] rounded-full opacity-[0.03]"
          style={{ background: `radial-gradient(circle, ${ACCENT} 0%, transparent 70%)` }}
        />
        <div className="absolute bottom-[-15%] right-[-5%] w-[50%] h-[50%] rounded-full opacity-[0.02]"
          style={{ background: `radial-gradient(circle, ${ACCENT} 0%, transparent 70%)` }}
        />
      </div>

      <motion.div 
        className="text-center max-w-lg mx-auto"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      >
        {/* Large 404 with gradient */}
        <motion.div 
          className="mb-6"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
        >
          <span className="text-[140px] md:text-[180px] leading-none font-display font-extrabold tracking-tighter"
            style={{
              background: `linear-gradient(135deg, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0.04) 100%)`,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            404
          </span>
        </motion.div>

        {/* Decorative line */}
        <motion.div 
          className="w-12 h-[2px] mx-auto mb-6 rounded-full"
          style={{ background: ACCENT }}
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 0.5, delay: 0.25, ease: [0.16, 1, 0.3, 1] }}
        />

        {/* Heading */}
        <motion.h1 
          className="text-2xl md:text-3xl font-display font-bold mb-4 tracking-tight"
          style={{ color: 'rgba(255,255,255,0.85)' }}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
        >
          {t('not_found.title')}
        </motion.h1>

        {/* Description */}
        <motion.p 
          className="text-sm md:text-base leading-relaxed mb-10 max-w-sm mx-auto"
          style={{ color: 'rgba(255,255,255,0.4)' }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.4 }}
        >
          {t('not_found.desc')}
        </motion.p>

        {/* CTA Buttons */}
        <motion.div 
          className="flex flex-col sm:flex-row gap-3 justify-center"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}
        >
          <Link
            to="/"
            className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl text-sm font-semibold text-white transition-all duration-300 active:scale-[0.97]"
            style={{ background: ACCENT }}
          >
            <Home size={18} />
            {t('not_found.back_home')}
          </Link>

          <button
            onClick={() => window.history.back()}
            className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl text-sm font-semibold transition-all duration-200 active:scale-[0.97]"
            style={{ 
              color: 'rgba(255,255,255,0.6)',
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.08)',
            }}
          >
            <ArrowLeft size={18} />
            {t('not_found.go_back')}
          </button>
        </motion.div>

        {/* Search hint */}
        <motion.div 
          className="mt-12"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.6 }}
        >
          <p className="text-xs" style={{ color: 'rgba(255,255,255,0.25)' }}>
            <span className="inline-flex items-center gap-1.5">
              <Search size={12} />
              Try searching or browsing our{' '}
              <Link to="/products" className="font-medium transition-colors duration-200 hover:text-white"
                style={{ color: 'rgba(255,255,255,0.4)' }}
              >
                products
              </Link>
            </span>
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
}

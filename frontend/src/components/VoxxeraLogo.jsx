import React from 'react';

/**
 * Dedicated Voxxera POS logo – wordmark + icon.
 * Use variant="full" for login/hero, variant="compact" for header.
 */
const VoxxeraLogo = ({ variant = 'full', className = '' }) => {
    const isCompact = variant === 'compact';

    const icon = (
        <div
            className="flex items-center justify-center rounded-xl bg-gradient-to-br from-amber-400/90 to-purple-500/90 text-white font-black shrink-0"
            style={{
                width: isCompact ? 40 : 72,
                height: isCompact ? 40 : 72,
                fontSize: isCompact ? '1rem' : '1.75rem',
            }}
        >
            V
        </div>
    );

    if (isCompact) {
        return (
            <div className={`flex items-center gap-3 ${className}`}>
                {icon}
                <span className="text-xl sm:text-2xl font-bold tracking-tight text-white">
                    <span className="bg-gradient-to-r from-white to-purple-200 bg-clip-text text-transparent">Voxxera</span>
                    <span className="text-purple-300 ml-1 font-semibold text-sm align-top">POS</span>
                </span>
            </div>
        );
    }

    return (
        <div className={`flex flex-col items-center gap-3 ${className}`}>
            {icon}
            <div className="text-center">
                <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
                    <span className="bg-gradient-to-r from-white via-purple-100 to-amber-200/90 bg-clip-text text-transparent">Voxxera</span>
                    <span className="text-purple-300 ml-2 font-semibold text-2xl sm:text-3xl align-middle">POS</span>
                </h1>
            </div>
        </div>
    );
};

export default VoxxeraLogo;

document.addEventListener('DOMContentLoaded', () => {
    const badges = Array.from(document.querySelectorAll('[data-google-reviews-badge]'));

    if (!badges.length) {
        return;
    }

    const reviewFileCandidates = [
        './assets/files/google-reviews.json',
        '/assets/files/google-reviews.json',
    ];

    const loadReviews = async () => {
        for (const filePath of reviewFileCandidates) {
            try {
                const response = await fetch(filePath, { cache: 'no-store' });

                if (!response.ok) {
                    continue;
                }

                const payload = await response.json();
                return Array.isArray(payload?.reviews) ? payload.reviews : [];
            } catch (_error) {
                // Try the next candidate path.
            }
        }

        return [];
    };

    const createStars = (rating) => {
        const safeRating = Math.max(0, Math.min(5, Number.isFinite(rating) ? rating : 0));
        const fullStars = Math.round(safeRating);
        return `${'★'.repeat(fullStars)}${'☆'.repeat(5 - fullStars)}`;
    };

    const updateBadges = (rating, reviewCount) => {
        const ratingText = rating.toLocaleString('nl-NL', {
            minimumFractionDigits: 1,
            maximumFractionDigits: 1,
        });
        const reviewCountText = `${reviewCount}`;
        const reviewsLabelText = `${reviewCount} ${reviewCount === 1 ? 'review' : 'reviews'}`;

        badges.forEach((badge) => {
            const starsElement = badge.querySelector('[data-google-reviews-stars]');
            const countElement = badge.querySelector('[data-google-reviews-count]');

            if (starsElement) {
                starsElement.textContent = createStars(rating);
            }

            if (countElement) {
                countElement.textContent = `(${reviewCountText})`;
            }

            badge.setAttribute('aria-label', `Bekijk Google reviews: score ${ratingText} op basis van ${reviewsLabelText}`);
        });
    };

    const init = async () => {
        const reviews = await loadReviews();
        const ratings = reviews
            .map((review) => (Number.isFinite(review?.rating) ? review.rating : null))
            .filter((rating) => rating !== null);

        if (!ratings.length) {
            return;
        }

        const totalRating = ratings.reduce((sum, rating) => sum + rating, 0);
        const averageRating = totalRating / ratings.length;

        updateBadges(averageRating, ratings.length);
    };

    init();
});

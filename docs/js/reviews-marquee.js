document.addEventListener('DOMContentLoaded', () => {
    const sliderRoot = document.querySelector('[data-reviews-slider]');
    const viewport = sliderRoot?.querySelector('[data-reviews-viewport]');
    const track = sliderRoot?.querySelector('[data-reviews-track]');
    const prevButton = sliderRoot?.querySelector('[data-reviews-prev]');
    const nextButton = sliderRoot?.querySelector('[data-reviews-next]');
    const dotsContainer = sliderRoot?.querySelector('[data-reviews-dots]');

    if (!sliderRoot || !viewport || !track || !dotsContainer) {
        return;
    }

    const reviewFileCandidates = [
        './assets/files/google-reviews.json',
    ];

    let currentSlideIndex = 0;
    let slideOffsets = [];
    let slideElements = [];
    let scrollTicking = false;
    let hasRevealedDots = false;
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const normalizeWhitespace = (value) => {
        if (typeof value !== 'string') {
            return '';
        }

        return value.replace(/\s+/g, ' ').trim();
    };

    const formatDate = (isoDate, fallbackDate) => {
        if (typeof isoDate === 'string') {
            const parsedDate = new Date(isoDate);

            if (!Number.isNaN(parsedDate.getTime())) {
                return new Intl.DateTimeFormat('nl-NL', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                }).format(parsedDate);
            }
        }

        return normalizeWhitespace(fallbackDate);
    };

    const getReviewTimestamp = (review) => {
        const isoDateCandidates = [review?.iso_date, review?.iso_date_of_last_edit];

        for (const candidate of isoDateCandidates) {
            if (typeof candidate !== 'string') {
                continue;
            }

            const parsedTimestamp = Date.parse(candidate);

            if (!Number.isNaN(parsedTimestamp)) {
                return parsedTimestamp;
            }
        }

        const fallbackTimestamp = Date.parse(review?.date || '');
        return Number.isNaN(fallbackTimestamp) ? 0 : fallbackTimestamp;
    };

    const getReviewContentLength = (review) => {
        const baseSnippet = normalizeWhitespace(review?.snippet || review?.extracted_snippet?.original || '');
        const ownerResponse = normalizeWhitespace(review?.response?.snippet || '');
        return baseSnippet.length + ownerResponse.length;
    };

    const createPill = (label) => {
        const pill = document.createElement('span');

        pill.className =
            'inline-flex items-center rounded-full border border-charcoal/10 bg-white/80 px-2.5 py-1 text-[11px] font-inter font-semibold tracking-tight text-charcoal/75';
        pill.textContent = label;

        return pill;
    };

    const createStars = (rating) => {
        const safeRating = Math.max(0, Math.min(5, Number.isFinite(rating) ? rating : 0));
        const fullStars = Math.round(safeRating);
        const stars = `${'★'.repeat(fullStars)}${'☆'.repeat(5 - fullStars)}`;
        const starsLine = document.createElement('p');

        starsLine.className = 'text-[15px] leading-none tracking-[0.02em] text-[#fbbc04]';
        starsLine.textContent = stars;

        return starsLine;
    };

    const createReviewTile = (review) => {
        const card = document.createElement('article');
        card.className =
            'flex w-[min(88vw,380px)] snap-start shrink-0 flex-col gap-3 self-start rounded-[22px] border border-charcoal/20 bg-white p-4 md:w-[calc((100%-1rem)/2)] lg:w-[calc((100%-2rem)/3)] xl:w-[calc((100%-3rem)/4)]';

        const header = document.createElement('div');
        header.className = 'flex items-start justify-between gap-2';

        const userBlock = document.createElement('div');
        userBlock.className = 'flex min-w-0 items-start gap-3';

        const avatar = document.createElement('img');
        avatar.className = 'h-10 w-10 shrink-0 rounded-full bg-gray-100 object-cover';
        avatar.src = review?.user?.thumbnail || './assets/images/logos/lumazon-icon-zwart-geel.png';
        avatar.alt = review?.user?.name ? `Foto van ${review.user.name}` : 'Profiel foto';
        avatar.loading = 'lazy';
        avatar.decoding = 'async';

        const nameWrap = document.createElement('div');
        nameWrap.className = 'min-w-0';

        const name = document.createElement('p');
        name.className = 'truncate font-inter text-[17px] font-medium leading-[1.1] tracking-tight text-[#202124]';
        name.textContent = normalizeWhitespace(review?.user?.name) || 'Anonieme reviewer';

        const guide = document.createElement('p');
        guide.className = 'mt-0.5 text-[13px] font-inter text-[#5f6368]';

        if (review?.user?.local_guide) {
            const guideStats = [];

            if (Number.isFinite(review?.user?.reviews)) {
                guideStats.push(`${review.user.reviews} reviews`);
            }

            if (Number.isFinite(review?.user?.photos)) {
                guideStats.push(`${review.user.photos} fotos`);
            }

            const guideSuffix = guideStats.length ? ` • ${guideStats.join(', ')}` : '';
            guide.textContent = `Local Guide${guideSuffix}`;
        } else {
            const reviewCountText = Number.isFinite(review?.user?.reviews) ? `${review.user.reviews} reviews` : '';
            guide.textContent = reviewCountText || (review?.source ? `Bron: ${review.source}` : 'Google review');
        }

        nameWrap.append(name, guide);

        const ratingValue = Number.isFinite(review?.rating) ? review.rating : 0;

        const menu = document.createElement('a');
        menu.className = 'shrink-0 select-none px-1 text-[20px] leading-none text-[#5f6368]';
        menu.href = 'https://www.google.com/search?q=reviews+voor+lumazon';
        menu.target = '_blank';
        menu.rel = 'noreferrer noopener';
        menu.setAttribute('aria-label', 'Bekijk reviews voor Lumazon op Google');
        menu.textContent = '⋮';

        userBlock.append(avatar, nameWrap);
        header.append(userBlock, menu);

        const ratingRow = document.createElement('div');
        ratingRow.className = 'flex flex-wrap items-center gap-2';

        const stars = createStars(ratingValue);
        ratingRow.appendChild(stars);

        const reviewDate = formatDate(review?.iso_date, review?.date);

        if (reviewDate) {
            const dateLabel = document.createElement('span');
            dateLabel.className = 'text-[13px] font-inter text-[#5f6368]';
            dateLabel.textContent = reviewDate;
            ratingRow.appendChild(dateLabel);
        }

        const snippet = document.createElement('p');
        snippet.className = 'text-[15px] leading-[1.45] tracking-[-0.01em] font-inter text-[#3c4043]';
        snippet.setAttribute('data-readmore-paragraph', '');
        snippet.setAttribute('data-review-user-snippet', '');

        const snippetText = document.createElement('span');
        snippetText.setAttribute('data-readmore-text', '');
        snippetText.textContent = normalizeWhitespace(review?.snippet || review?.extracted_snippet?.original || '');

        const snippetToggle = document.createElement('button');
        snippetToggle.type = 'button';
        snippetToggle.setAttribute('data-readmore-toggle', '');
        snippetToggle.className =
            'inline font-inter text-[15px] leading-[1.45] tracking-tight text-[#5f6368] transition-opacity duration-200 hover:opacity-80';
        snippetToggle.setAttribute('aria-expanded', 'false');
        snippetToggle.textContent = '... meer';

        snippet.append(snippetText, snippetToggle);

        card.append(header, ratingRow, snippet);

        if (review?.response?.snippet) {
            const response = document.createElement('div');
            response.className = 'border-l-[2px] border-l-grey-200 px-3 py-2';
            response.setAttribute('data-review-owner-response', '');

            const responseTitle = document.createElement('p');
            responseTitle.className = 'text-[11px] font-inter font-semibold tracking-[0.01em] text-[#5f6368]';
            responseTitle.textContent = 'Reactie van eigenaar';

            const responseText = document.createElement('p');
            responseText.className = 'mt-1 text-[13px] leading-[1.45] tracking-[-0.01em] font-inter text-[#3c4043]';
            responseText.setAttribute('data-readmore-paragraph', '');
            responseText.setAttribute('data-readmore-lines', '2');

            const responseTextSpan = document.createElement('span');
            responseTextSpan.setAttribute('data-readmore-text', '');
            responseTextSpan.textContent = normalizeWhitespace(review.response.snippet);

            const responseToggle = document.createElement('button');
            responseToggle.type = 'button';
            responseToggle.setAttribute('data-readmore-toggle', '');
            responseToggle.className =
                'inline font-inter text-[13px] leading-[1.45] tracking-tight text-[#5f6368] transition-opacity duration-200 hover:opacity-80';
            responseToggle.setAttribute('aria-expanded', 'false');
            responseToggle.textContent = '... meer';

            responseText.append(responseTextSpan, responseToggle);
            response.append(responseTitle, responseText);
            card.appendChild(response);
        }

        const footer = document.createElement('div');
        footer.className = 'flex items-center justify-end pt-1';

        const sourceLink = document.createElement('a');
        sourceLink.className = 'inline-flex items-center';
        sourceLink.href = 'https://www.google.com/search?q=reviews+voor+lumazon';
        sourceLink.target = '_blank';
        sourceLink.rel = 'noreferrer noopener';
        sourceLink.setAttribute('aria-label', 'Bekijk Lumazon reviews op Google');

        const sourceLogo = document.createElement('img');
        sourceLogo.src = './assets/images/logos/google-logo.png';
        sourceLogo.alt = 'Google';
        sourceLogo.className = 'h-4 w-auto';
        sourceLogo.loading = 'lazy';
        sourceLogo.decoding = 'async';

        sourceLink.appendChild(sourceLogo);
        footer.append(sourceLink);
        card.append(footer);

        return card;
    };

    const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

    const findNearestSlideIndex = () => {
        if (!slideOffsets.length) {
            return 0;
        }

        const left = viewport.scrollLeft;
        let nearestIndex = 0;
        let nearestDistance = Number.POSITIVE_INFINITY;

        slideOffsets.forEach((offset, index) => {
            const distance = Math.abs(offset - left);

            if (distance < nearestDistance) {
                nearestDistance = distance;
                nearestIndex = index;
            }
        });

        return nearestIndex;
    };

    const setButtonState = () => {
        const hasMultipleSlides = slideElements.length > 1;

        if (prevButton) {
            prevButton.disabled = !hasMultipleSlides || currentSlideIndex <= 0;
            prevButton.classList.toggle('opacity-40', prevButton.disabled);
            prevButton.classList.toggle('pointer-events-none', prevButton.disabled);
        }

        if (nextButton) {
            nextButton.disabled = !hasMultipleSlides || currentSlideIndex >= slideElements.length - 1;
            nextButton.classList.toggle('opacity-40', nextButton.disabled);
            nextButton.classList.toggle('pointer-events-none', nextButton.disabled);
        }
    };

    const setActiveDot = () => {
        const dotButtons = dotsContainer.querySelectorAll('[data-reviews-dot]');

        dotButtons.forEach((dotButton) => {
            const dotIndex = Number.parseInt(dotButton.getAttribute('data-reviews-dot') || '0', 10);
            const isActive = dotIndex === currentSlideIndex;
            const dotBar = dotButton.querySelector('[data-reviews-dot-bar]');

            if (dotBar) {
                dotBar.classList.toggle('bg-white', isActive);
                dotBar.classList.toggle('bg-white/30', !isActive);
            }

            dotButton.setAttribute('aria-current', isActive ? 'true' : 'false');
        });
    };

    const updateSliderUI = () => {
        setButtonState();
        setActiveDot();
    };

    const scrollToSlide = (index, behavior = 'smooth') => {
        if (!slideOffsets.length) {
            return;
        }

        currentSlideIndex = clamp(index, 0, slideOffsets.length - 1);
        viewport.scrollTo({ left: slideOffsets[currentSlideIndex], behavior });
        updateSliderUI();
    };

    const buildDots = () => {
        dotsContainer.innerHTML = '';

        if (slideElements.length <= 1) {
            dotsContainer.classList.add('hidden');
            return;
        }

        dotsContainer.classList.remove('hidden');

        const dotsFragment = document.createDocumentFragment();

        slideElements.forEach((_slide, index) => {
            const dot = document.createElement('button');
            const dotBar = document.createElement('span');

            dot.type = 'button';
            dot.className =
                'inline-flex h-4 w-8 shrink-0 items-center justify-center rounded-full transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70 focus-visible:ring-offset-2 focus-visible:ring-offset-charcoal';
            dot.setAttribute('data-reviews-dot', `${index}`);
            dot.setAttribute('aria-label', `Ga naar review ${index + 1}`);
            dot.setAttribute('aria-current', 'false');

            dotBar.className = 'block h-0.5 w-8 max-w-full shrink-0 rounded-full bg-white/30 transition-colors duration-200';
            dotBar.setAttribute('data-reviews-dot-bar', '');

            dot.addEventListener('click', () => {
                scrollToSlide(index);
            });

            dot.appendChild(dotBar);
            dotsFragment.appendChild(dot);
        });

        dotsContainer.appendChild(dotsFragment);
    };

    const setupDotsReveal = () => {
        const dotButtons = Array.from(dotsContainer.querySelectorAll('[data-reviews-dot]'));

        if (!dotButtons.length) {
            return;
        }

        if (prefersReducedMotion || hasRevealedDots) {
            dotButtons.forEach((dotButton) => {
                dotButton.style.opacity = '1';
                dotButton.style.transform = 'translate3d(0, 0, 0) scale3d(1, 1, 1)';

                if (hasRevealedDots) {
                    dotButton.style.transition = 'none';
                }
            });

            hasRevealedDots = true;
            return;
        }

        const firstDelayMs = 170;
        const dotsStaggerMs = 70;

        dotButtons.forEach((dotButton, index) => {
            dotButton.style.opacity = '0';
            dotButton.style.transform = 'translate3d(0, 7px, 0) scale3d(0.82, 1, 1)';
            dotButton.style.willChange = 'opacity, transform';
            dotButton.style.transitionProperty = 'opacity, transform';
            dotButton.style.transitionDuration = '620ms';
            dotButton.style.transitionTimingFunction = 'cubic-bezier(0.22, 1, 0.36, 1)';
            dotButton.style.transitionDelay = `${firstDelayMs + index * dotsStaggerMs}ms`;
        });

        const revealDots = () => {
            hasRevealedDots = true;

            window.requestAnimationFrame(() => {
                dotButtons.forEach((dotButton) => {
                    dotButton.style.opacity = '1';
                    dotButton.style.transform = 'translate3d(0, 0, 0) scale3d(1, 1, 1)';
                });
            });
        };

        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (!entry.isIntersecting) {
                        return;
                    }

                    revealDots();
                    observer.unobserve(entry.target);
                });
            },
            {
                root: null,
                threshold: 0.35,
                rootMargin: '0px 0px -8% 0px',
            }
        );

        observer.observe(dotsContainer);
    };

    const updateSlides = () => {
        slideElements = Array.from(track.children);
        slideOffsets = slideElements.map((slide) => slide.offsetLeft);
        currentSlideIndex = clamp(findNearestSlideIndex(), 0, Math.max(0, slideElements.length - 1));
        updateSliderUI();
    };

    const setupEntranceAnimation = () => {
        if (!slideElements.length) {
            return;
        }

        if (prefersReducedMotion) {
            slideElements.forEach((slide) => {
                slide.style.opacity = '1';
                slide.style.transform = 'translate3d(0, 0, 0)';
            });
            return;
        }

        const firstDelayMs = 80;
        const cardStaggerMs = 110;

        slideElements.forEach((slide, index) => {
            slide.style.opacity = '0';
            slide.style.transform = 'translate3d(0, 16px, 0)';
            slide.style.willChange = 'opacity, transform';
            slide.style.transitionProperty = 'opacity, transform';
            slide.style.transitionDuration = '760ms';
            slide.style.transitionTimingFunction = 'cubic-bezier(0.22, 1, 0.36, 1)';
            slide.style.transitionDelay = `${firstDelayMs + index * cardStaggerMs}ms`;
        });

        const firstSlide = slideElements[0];
        const firstUserSnippet = firstSlide?.querySelector('[data-review-user-snippet]');
        const firstOwnerResponse = firstSlide?.querySelector('[data-review-owner-response]');
        const firstCardItems = [firstUserSnippet, firstOwnerResponse].filter(Boolean);

        firstCardItems.forEach((item, index) => {
            item.style.opacity = '0';
            item.style.transform = 'translate3d(0, 12px, 0)';
            item.style.willChange = 'opacity, transform';
            item.style.transitionProperty = 'opacity, transform';
            item.style.transitionDuration = '700ms';
            item.style.transitionTimingFunction = 'cubic-bezier(0.22, 1, 0.36, 1)';
            item.style.transitionDelay = `${firstDelayMs + cardStaggerMs + index * 140}ms`;
        });

        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (!entry.isIntersecting) {
                        return;
                    }

                    window.requestAnimationFrame(() => {
                        slideElements.forEach((slide) => {
                            slide.style.opacity = '1';
                            slide.style.transform = 'translate3d(0, 0, 0)';
                        });

                        firstCardItems.forEach((item) => {
                            item.style.opacity = '1';
                            item.style.transform = 'translate3d(0, 0, 0)';
                        });
                    });

                    observer.unobserve(entry.target);
                });
            },
            {
                root: null,
                threshold: 0.35,
                rootMargin: '0px 0px -8% 0px',
            }
        );

        observer.observe(sliderRoot);
    };

    const attachSliderEvents = () => {
        prevButton?.addEventListener('click', () => {
            scrollToSlide(currentSlideIndex - 1);
        });

        nextButton?.addEventListener('click', () => {
            scrollToSlide(currentSlideIndex + 1);
        });

        viewport.addEventListener('scroll', () => {
            if (scrollTicking) {
                return;
            }

            scrollTicking = true;

            requestAnimationFrame(() => {
                currentSlideIndex = findNearestSlideIndex();
                updateSliderUI();
                scrollTicking = false;
            });
        });

        window.addEventListener('resize', () => {
            const previousIndex = currentSlideIndex;

            updateSlides();
            scrollToSlide(previousIndex, 'auto');
        });
    };

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

    const init = async () => {
        const reviews = await loadReviews();

        if (!reviews.length) {
            sliderRoot.classList.add('hidden');
            return;
        }

        const fragment = document.createDocumentFragment();

        const reviewsSortedByLatest = [...reviews].sort(
            (leftReview, rightReview) => getReviewTimestamp(rightReview) - getReviewTimestamp(leftReview)
        );

        let longestReview = null;
        let longestReviewLength = -1;

        reviewsSortedByLatest.forEach((review) => {
            const reviewLength = getReviewContentLength(review);

            if (reviewLength > longestReviewLength) {
                longestReviewLength = reviewLength;
                longestReview = review;
            }
        });

        const reviewsForRender = longestReview
            ? [longestReview, ...reviewsSortedByLatest.filter((review) => review !== longestReview)]
            : reviewsSortedByLatest;

        reviewsForRender.forEach((review) => {
            fragment.appendChild(createReviewTile(review));
        });

        track.innerHTML = '';
        track.appendChild(fragment);

        updateSlides();
        setupEntranceAnimation();
        buildDots();
        setupDotsReveal();
        scrollToSlide(0, 'auto');
        attachSliderEvents();

        document.dispatchEvent(new Event('readmore:refresh'));
    };

    init();
});

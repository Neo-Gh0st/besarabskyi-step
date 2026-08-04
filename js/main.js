window.getCurrentLang = function() { return localStorage.getItem('lang') || 'uk'; };

document.addEventListener('DOMContentLoaded', function() {
    // Модальное окно
    var modalOverlay = document.getElementById('modalOverlay');
    var modalIcon = document.getElementById('modalIcon');
    var modalTitle = document.getElementById('modalTitle');
    var modalText = document.getElementById('modalText');
    var modalBtn = document.getElementById('modalBtn');

    function showModal(type, title, text) {
        if (!modalOverlay) return;
        modalIcon.textContent = type === 'success' ? '✅' : '❌';
        modalTitle.textContent = title;
        modalText.textContent = text;
        modalOverlay.className = 'modal-overlay active modal--' + type;
    }

    if (modalBtn) {
        modalBtn.addEventListener('click', function() {
            modalOverlay.className = 'modal-overlay';
        });
    }

    if (modalOverlay) {
        modalOverlay.addEventListener('click', function(e) {
            if (e.target === modalOverlay) {
                modalOverlay.className = 'modal-overlay';
            }
        });
    }

    // Mobile menu
    const burger = document.getElementById('burger');
    const nav = document.getElementById('nav');
    
    if (burger && nav) {
        burger.addEventListener('click', function() {
            burger.classList.toggle('active');
            nav.classList.toggle('active');
        });
        
        nav.querySelectorAll('.nav__link').forEach(function(link) {
            link.addEventListener('click', function() {
                burger.classList.remove('active');
                nav.classList.remove('active');
            });
        });
    }
    
    // Header scroll effect
    const header = document.getElementById('header');
    window.addEventListener('scroll', function() {
        if (window.scrollY > 100) {
            header.style.boxShadow = '0 4px 20px rgba(0,0,0,0.15)';
        } else {
            header.style.boxShadow = '';
        }
    });
    
    // Gallery filter
    const filterButtons = document.querySelectorAll('.gallery__filter');
    const galleryItems = document.querySelectorAll('.gallery__item');
    
    filterButtons.forEach(function(button) {
        button.addEventListener('click', function() {
            filterButtons.forEach(function(btn) {
                btn.classList.remove('active');
            });
            button.classList.add('active');
            
            var filter = button.getAttribute('data-filter');
            
            galleryItems.forEach(function(item) {
                if (filter === 'all' || item.getAttribute('data-category') === filter) {
                    item.classList.remove('hidden');
                } else {
                    item.classList.add('hidden');
                }
            });
        });
    });
    
    // Booking form
    var bookingForm = document.getElementById('bookingForm');
    var conflictOverlay = document.getElementById('conflictOverlay');
    var conflictBtn = document.getElementById('conflictBtn');
    var conflictTable = document.getElementById('conflictTable');

    if (conflictBtn && conflictOverlay) {
        conflictBtn.addEventListener('click', function() {
            conflictOverlay.className = 'modal-overlay';
        });
        conflictOverlay.addEventListener('click', function(e) {
            if (e.target === conflictOverlay) {
                conflictOverlay.className = 'modal-overlay';
            }
        });
    }

    function findConflicts(dateIn, dateOut, roomType) {
        var conflicts = [];
        var rt = (roomType || '').toLowerCase().trim();
        for (var i = 0; i < bookedDates.length; i++) {
            var item = bookedDates[i];
            var itemRoom = (item.room || '').toLowerCase().trim();
            if (rt && itemRoom !== rt) continue;
            if (dateIn <= item.to && dateOut >= item.from) {
                conflicts.push(item);
            }
        }
        return conflicts;
    }

    function roomTypeLabel(type) {
        var labels = {
            family: 'Сімейний',
            'family-plus': 'Сімейний+',
            'family-lux': 'Сімейний Люкс',
            'family-2': 'Сімейний 2',
            'family-plus-2': 'Сімейний+ 2',
            'double-lux-1': 'Люкс 1',
            'double-lux-2': 'Люкс 2'
        };
        return labels[type] || type;
    }

    function showConflictModal(conflicts) {
        var roomName = roomTypeLabel(document.getElementById('roomType').value);
        var html = '<table class="conflict-table">';
        html += '<tr><th>Тип</th><th>Зайнято з</th><th>Зайнято по</th></tr>';
        for (var i = 0; i < conflicts.length; i++) {
            var c = conflicts[i];
            html += '<tr><td>' + roomTypeLabel(c.room) + '</td><td>' + c.from + '</td><td>' + c.to + '</td></tr>';
        }
        html += '</table>';
        conflictTable.innerHTML = html;
        conflictOverlay.className = 'modal-overlay active';
    }

    if (bookingForm) {
        bookingForm.addEventListener('submit', function(e) {
            e.preventDefault();

            var formData = new FormData(bookingForm);
            var data = {
                name: formData.get('name'),
                phone: formData.get('phone'),
                roomType: formData.get('roomType'),
                dateIn: formData.get('dateIn'),
                dateOut: formData.get('dateOut'),
                guests: formData.get('guests'),
                comment: formData.get('comment')
            };

            // Клієнтська перевірка перетину дат
            if (data.dateIn && data.dateOut && data.roomType) {
                var conflicts = findConflicts(data.dateIn, data.dateOut, data.roomType);
                if (conflicts.length > 0) {
                    showConflictModal(conflicts);
                    return;
                }
            }
            
            var submitBtn = bookingForm.querySelector('button[type="submit"]');
            var originalText = submitBtn.textContent;
            submitBtn.textContent = 'Надсилання...';
            submitBtn.disabled = true;
            
            var SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzNACUD2FO4cCRQw1IcqdKxRYvsPAdRzA4vy-1d3ErKQbe1HGl76mtzPoUHR_Uu3nKTZw/exec';
            
            var iframeName = 'submit_iframe_' + Date.now();
            var iframe = document.createElement('iframe');
            iframe.name = iframeName;
            iframe.style.display = 'none';
            document.body.appendChild(iframe);
            
            var form = document.createElement('form');
            form.method = 'POST';
            form.action = SCRIPT_URL;
            form.target = iframeName;
            
            for (var key in data) {
                var input = document.createElement('input');
                input.type = 'hidden';
                input.name = key;
                input.value = data[key] || '';
                form.appendChild(input);
            }
            
            document.body.appendChild(form);

            // Слухаємо postMessage з iframe (сервер повертає OK або OVERLAP)
            var messageHandler = function(e) {
                if (e.data === 'OK' || e.data === 'OVERLAP') {
                    window.removeEventListener('message', messageHandler);
                    clearTimeout(fallbackTimer);
                    setTimeout(function() {
                        try {
                            document.body.removeChild(form);
                            document.body.removeChild(iframe);
                        } catch(ex) {}
                        if (e.data === 'OVERLAP') {
                            showConflictModal([{from: data.dateIn, to: data.dateOut, room: data.roomType}]);
                            submitBtn.textContent = originalText;
                            submitBtn.disabled = false;
                        } else {
                            showModal('success', 'Заявку надіслано!', 'Дякуємо, ' + data.name + '! Ми зв\'яжемося з вами найближчим часом для підтвердження бронювання.');
                            bookingForm.reset();
                            submitBtn.textContent = originalText;
                            submitBtn.disabled = false;
                        }
                    }, 300);
                }
            };
            window.addEventListener('message', messageHandler);

            // Fallback: якщо postMessage не прийшов за 8 сек — показуємо success
            var fallbackTimer = setTimeout(function() {
                window.removeEventListener('message', messageHandler);
                try {
                    document.body.removeChild(form);
                    document.body.removeChild(iframe);
                } catch(ex) {}
                showModal('success', 'Заявку надіслано!', 'Дякуємо, ' + data.name + '! Ми зв\'яжемося з вами найближчим часом для підтвердження бронювання.');
                bookingForm.reset();
                submitBtn.textContent = originalText;
                submitBtn.disabled = false;
            }, 8000);

            form.submit();
        });
    }
    
    // Smooth scroll for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(function(anchor) {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            var target = document.querySelector(this.getAttribute('href'));
            if (target) {
                var headerHeight = document.querySelector('.header').offsetHeight;
                var targetPosition = target.offsetTop - headerHeight;
                window.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth'
                });
            }
        });
    });
    
    // Set minimum date for booking
    var dateInInput = document.getElementById('dateIn');
    var dateOutInput = document.getElementById('dateOut');
    
    if (dateInInput && dateOutInput) {
        var today = new Date();
        var todayStr = today.toISOString().split('T')[0];
        dateInInput.setAttribute('min', todayStr);
        dateOutInput.setAttribute('min', todayStr);
        
        dateInInput.addEventListener('change', function() {
            var checkIn = new Date(this.value);
            checkIn.setDate(checkIn.getDate() + 1);
            var minCheckOut = checkIn.toISOString().split('T')[0];
            dateOutInput.setAttribute('min', minCheckOut);
            
            if (dateOutInput.value && dateOutInput.value < minCheckOut) {
                dateOutInput.value = minCheckOut;
            }
        });
    }
    
    // Animate features on scroll
    var features = document.querySelectorAll('.feature, .room-card, .contact-card');
    
    var observer = new IntersectionObserver(function(entries) {
        entries.forEach(function(entry) {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, { threshold: 0.1 });
    
    features.forEach(function(feature) {
        feature.style.opacity = '0';
        feature.style.transform = 'translateY(30px)';
        feature.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(feature);
    });

    // === Вкладки поверхів ===
    var floorTabs = document.querySelectorAll('.floor-tab');
    var floor1 = document.getElementById('floor1');
    var floor2 = document.getElementById('floor2');
    var floor3 = document.getElementById('floor3');

    floorTabs.forEach(function(tab) {
        tab.addEventListener('click', function() {
            floorTabs.forEach(function(t) { t.classList.remove('floor-tab--active'); });
            tab.classList.add('floor-tab--active');

            var floor = tab.getAttribute('data-floor');
            floor1.style.display = 'none';
            floor2.style.display = 'none';
            floor3.style.display = 'none';

            if (floor === '1') {
                floor1.style.display = '';
            } else if (floor === '2') {
                floor2.style.display = '';
            } else {
                floor3.style.display = '';
            }
        });
    });

    // === 6 календарів (по одному на тип номера) ===
    var calScriptUrl = 'https://script.google.com/macros/s/AKfycbzNACUD2FO4cCRQw1IcqdKxRYvsPAdRzA4vy-1d3ErKQbe1HGl76mtzPoUHR_Uu3nKTZw/exec';
    var bookedDates = [];

    var monthNames = {
        uk: ['Січень', 'Лютий', 'Березень', 'Квітень', 'Травень', 'Червень',
            'Липень', 'Серпень', 'Вересень', 'Жовтень', 'Листопад', 'Грудень'],
        en: ['January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December']
    };

    var calendars = [
        { type: 'family', month: new Date().getMonth(), year: new Date().getFullYear(),
          monthEl: document.getElementById('calMonthFamily'), daysEl: document.getElementById('calDaysFamily'),
          prevBtn: document.getElementById('calPrevFamily'), nextBtn: document.getElementById('calNextFamily') },
        { type: 'family-plus', month: new Date().getMonth(), year: new Date().getFullYear(),
          monthEl: document.getElementById('calMonthFamilyPlus'), daysEl: document.getElementById('calDaysFamilyPlus'),
          prevBtn: document.getElementById('calPrevFamilyPlus'), nextBtn: document.getElementById('calNextFamilyPlus') },
        { type: 'family-lux', month: new Date().getMonth(), year: new Date().getFullYear(),
          monthEl: document.getElementById('calMonthFamilyLux'), daysEl: document.getElementById('calDaysFamilyLux'),
          prevBtn: document.getElementById('calPrevFamilyLux'), nextBtn: document.getElementById('calNextFamilyLux') },
        { type: 'family-2', month: new Date().getMonth(), year: new Date().getFullYear(),
          monthEl: document.getElementById('calMonthFamily2'), daysEl: document.getElementById('calDaysFamily2'),
          prevBtn: document.getElementById('calPrevFamily2'), nextBtn: document.getElementById('calNextFamily2') },
        { type: 'family-plus-2', month: new Date().getMonth(), year: new Date().getFullYear(),
          monthEl: document.getElementById('calMonthFamilyPlus2'), daysEl: document.getElementById('calDaysFamilyPlus2'),
          prevBtn: document.getElementById('calPrevFamilyPlus2'), nextBtn: document.getElementById('calNextFamilyPlus2') },
        { type: 'double-lux-1', month: new Date().getMonth(), year: new Date().getFullYear(),
          monthEl: document.getElementById('calMonthDoubleLux1'), daysEl: document.getElementById('calDaysDoubleLux1'),
          prevBtn: document.getElementById('calPrevDoubleLux1'), nextBtn: document.getElementById('calNextDoubleLux1') },
        { type: 'double-lux-2', month: new Date().getMonth(), year: new Date().getFullYear(),
          monthEl: document.getElementById('calMonthDoubleLux2'), daysEl: document.getElementById('calDaysDoubleLux2'),
          prevBtn: document.getElementById('calPrevDoubleLux2'), nextBtn: document.getElementById('calNextDoubleLux2') }
    ];

    function renderCal(cal) {
        if (!cal.daysEl || !cal.monthEl) return;

        cal.monthEl.textContent = monthNames[window.getCurrentLang()][cal.month] + ' ' + cal.year;

        var firstDay = new Date(cal.year, cal.month, 1);
        var lastDay = new Date(cal.year, cal.month + 1, 0);
        var startDay = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1;
        var daysInMonth = lastDay.getDate();
        var today = new Date();
        today.setHours(0, 0, 0, 0);

        var html = '';

        for (var i = 0; i < startDay; i++) {
            html += '<div class="calendar__day calendar__day--empty"></div>';
        }

        for (var d = 1; d <= daysInMonth; d++) {
            var date = new Date(cal.year, cal.month, d);
            var dateStr = cal.year + '-' + String(cal.month + 1).padStart(2, '0') + '-' + String(d).padStart(2, '0');
            var cls = 'calendar__day';

            if (date < today) {
                cls += ' calendar__day--past';
            } else if (isBookedForType(dateStr, cal.type)) {
                cls += ' calendar__day--booked';
            } else {
                cls += ' calendar__day--free';
            }

            if (date.getTime() === today.getTime()) {
                cls += ' calendar__day--today';
            }

            html += '<div class="' + cls + '" title="' + dateStr + '">' + d + '</div>';
        }

        cal.daysEl.innerHTML = html;
    }

    function isBookedForType(dateStr, roomType) {
        for (var i = 0; i < bookedDates.length; i++) {
            var item = bookedDates[i];
            var itemRoom = (item.room || '').toLowerCase().trim();
            if (itemRoom !== roomType) continue;
            if (dateStr >= item.from && dateStr <= item.to) {
                return true;
            }
        }
        return false;
    }

    function renderAllCalendars() {
        for (var i = 0; i < calendars.length; i++) {
            renderCal(calendars[i]);
        }
    }

    // Навигация для каждого календаря
    for (var i = 0; i < calendars.length; i++) {
        (function(cal) {
            if (cal.prevBtn) {
                cal.prevBtn.addEventListener('click', function() {
                    cal.month--;
                    if (cal.month < 0) { cal.month = 11; cal.year--; }
                    renderCal(cal);
                });
            }
            if (cal.nextBtn) {
                cal.nextBtn.addEventListener('click', function() {
                    cal.month++;
                    if (cal.month > 11) { cal.month = 0; cal.year++; }
                    renderCal(cal);
                });
            }
        })(calendars[i]);
    }

    // Сначала рендерим пустые календари
    renderAllCalendars();

    // Завантажуємо заброньовані дати
    fetchBookedDates();

    function fetchBookedDates() {
        fetch(calScriptUrl + '?action=booked&_=' + Date.now())
            .then(function(r) { return r.text(); })
            .then(function(text) {
                try {
                    var data = JSON.parse(text);
                    bookedDates = data || [];
                } catch(e) {
                    bookedDates = [];
                }
                renderAllCalendars();
                updateFloorPlan();
            })
            .catch(function() {
                loadBookedDatesJSONP();
            });
    }

    function loadBookedDatesJSONP() {
        var callbackName = 'calCb_' + Date.now();
        window[callbackName] = function(data) {
            delete window[callbackName];
            bookedDates = data || [];
            renderAllCalendars();
            updateFloorPlan();
        };
        var script = document.createElement('script');
        script.src = calScriptUrl + '?callback=' + callbackName + '&action=booked&_=' + Date.now();
        script.onerror = function() {
            delete window[callbackName];
        };
        document.body.appendChild(script);
    }

    // Підсвітка заброньованих номерів на схемі
    function updateFloorPlan() {
        var today = new Date();
        var todayStr = today.getFullYear() + '-' + String(today.getMonth() + 1).padStart(2, '0') + '-' + String(today.getDate()).padStart(2, '0');

        var bookedRooms = {};
        for (var i = 0; i < bookedDates.length; i++) {
            var item = bookedDates[i];
            if (todayStr >= item.from && todayStr <= item.to) {
                var room = (item.room || '').toLowerCase();
                bookedRooms[room] = true;
            }
        }

        var floor1Map = { Left: 'family', Top: 'family-plus', Right: 'family-lux' };
        var floor2Map = { Left: 'family-2', Right: 'family-plus-2' };
        var parts = ['Left', 'Right'];

        for (var p = 0; p < parts.length; p++) {
            var el1 = document.getElementById('plan1' + parts[p]);
            if (el1) {
                if (bookedRooms[floor1Map[parts[p]]]) {
                    el1.classList.add('booked');
                } else {
                    el1.classList.remove('booked');
                }
            }
            var el2 = document.getElementById('plan2' + parts[p]);
            if (el2) {
                if (bookedRooms[floor2Map[parts[p]]]) {
                    el2.classList.add('booked');
                } else {
                    el2.classList.remove('booked');
                }
            }
        }

        // Центр 1 поверху
        var plan1Top = document.getElementById('plan1Top');
        if (plan1Top) {
            if (bookedRooms['family-plus']) {
                plan1Top.classList.add('booked');
            } else {
                plan1Top.classList.remove('booked');
            }
        }

        // Центр 2 поверху (дві кімнати)
        var plan2Top1 = document.getElementById('plan2Top1');
        var plan2Top2 = document.getElementById('plan2Top2');
        if (plan2Top1) {
            if (bookedRooms['double-lux-1']) {
                plan2Top1.classList.add('booked');
            } else {
                plan2Top1.classList.remove('booked');
            }
        }
        if (plan2Top2) {
            if (bookedRooms['double-lux-2']) {
                plan2Top2.classList.add('booked');
            } else {
                plan2Top2.classList.remove('booked');
            }
        }
    }

    window.renderAllCalendars = function() {
        calendars.forEach(function(cal) { renderCal(cal); });
    };
});

// === Відгуки ===
(function() {
    var hardcodedReviews = {
        uk: [
            { text: 'Чудове місце для сімейного відпочинку! Дуже затишно, чисто, привітний персонал. Море поруч, діти в захваті.', author: 'Олена та Олексій', date: 'Липень 2026', stars: 5 },
            { text: 'Їздили компанією — все сподобалось. Кухня обладнана, територія охайнна, є де посидіти вечором. Рекомендую!', author: 'Андрій', date: 'Червень 2026', stars: 5 },
            { text: 'Відпочивали з дитиною 3 роки. Дуже зручно — пляж недалеко, є місце для ігор. Номер Люкс — просто супер!', author: 'Марина', date: 'Серпень 2025', stars: 5 },
            { text: 'Гарне місце, але хотілося б більше активностей для дітей. Загалом — рекомендую для тихого відпочинку.', author: 'Ігор та Наталія', date: 'Липень 2025', stars: 4 },
            { text: 'Повертаємось вже втретє! Щоразу краще. Дякуємо за гостинність!', author: 'Родина Коваленко', date: 'Вересень 2025', stars: 5 }
        ],
        en: [
            { text: 'A wonderful place for family vacation! Very cozy, clean, friendly staff. Sea nearby, kids love it.', author: 'Olena & Oleksii', date: 'July 2026', stars: 5 },
            { text: 'Went with a group — everything was great. Kitchen is well-equipped, territory is tidy, nice place to sit in the evening. Highly recommend!', author: 'Andrii', date: 'June 2026', stars: 5 },
            { text: 'Vacationed with a 3-year-old. Very convenient — beach is close, there\'s a play area. The Lux room is simply amazing!', author: 'Maryna', date: 'August 2025', stars: 5 },
            { text: 'Nice place, but would love more activities for kids. Overall — recommended for a quiet getaway.', author: 'Ihor & Nataliia', date: 'July 2025', stars: 4 },
            { text: 'We\'ve been back for the third time! Better every visit. Thank you for the hospitality!', author: 'Kovalenko Family', date: 'September 2025', stars: 5 }
        ]
    };

    var remoteReviews = [];
    var track = document.getElementById('reviewsTrack');
    var dotsContainer = document.getElementById('reviewsDots');
    var prevBtn = document.getElementById('reviewsPrev');
    var nextBtn = document.getElementById('reviewsNext');
    if (!track) return;

    var current = 0;

    function getAllReviews() {
        var lang = window.getCurrentLang();
        var base = hardcodedReviews[lang] || hardcodedReviews.uk;
        return base.concat(remoteReviews);
    }

    function buildReviews() {
        var list = getAllReviews();
        track.innerHTML = '';
        dotsContainer.innerHTML = '';
        current = 0;
        track.style.transform = 'translateX(0)';

        list.forEach(function(r, i) {
            var card = document.createElement('div');
            card.className = 'review-card';
            card.innerHTML = '<div class="review-card__stars">' + '&#9733;'.repeat(r.stars) + '&#9734;'.repeat(5 - r.stars) + '</div>' +
                '<p class="review-card__text">"' + r.text + '"</p>' +
                '<div class="review-card__author">' + r.author + '</div>' +
                '<div class="review-card__date">' + r.date + '</div>';
            track.appendChild(card);

            var dot = document.createElement('button');
            dot.className = 'reviews__dot' + (i === 0 ? ' active' : '');
            dot.addEventListener('click', function() { goTo(i); });
            dotsContainer.appendChild(dot);
        });
    }

    function goTo(index) {
        var list = getAllReviews();
        current = index;
        track.style.transform = 'translateX(-' + (current * 100) + '%)';
        var dots = dotsContainer.querySelectorAll('.reviews__dot');
        dots.forEach(function(d, i) { d.classList.toggle('active', i === current); });
    }

    prevBtn.addEventListener('click', function() {
        var list = getAllReviews();
        goTo(current > 0 ? current - 1 : list.length - 1);
    });
    nextBtn.addEventListener('click', function() {
        var list = getAllReviews();
        goTo(current < list.length - 1 ? current + 1 : 0);
    });

    // Load remote reviews
    var calScriptUrl = 'https://script.google.com/macros/s/AKfycbzNACUD2FO4cCRQw1IcqdKxRYvsPAdRzA4vy-1d3ErKQbe1HGl76mtzPoUHR_Uu3nKTZw/exec';
    fetch(calScriptUrl + '?action=reviews')
        .then(function(r) { return r.json(); })
        .then(function(data) {
            if (Array.isArray(data) && data.length > 0) {
                remoteReviews = data;
                buildReviews();
            }
        })
        .catch(function() {});

    buildReviews();
    window.renderReviews = buildReviews;
})();

// === Форма відгуку ===
(function() {
    var overlay = document.getElementById('reviewOverlay');
    var openBtn = document.getElementById('openReviewForm');
    var closeBtn = document.getElementById('closeReviewForm');
    var form = document.getElementById('reviewForm');
    var successEl = document.getElementById('reviewSuccess');
    var stars = document.querySelectorAll('#starRating .star');
    var ratingInput = document.getElementById('reviewRating');
    if (!overlay || !form) return;

    var scriptUrl = 'https://script.google.com/macros/s/AKfycbzNACUD2FO4cCRQw1IcqdKxRYvsPAdRzA4vy-1d3ErKQbe1HGl76mtzPoUHR_Uu3nKTZw/exec';

    function openModal() {
        overlay.classList.add('active');
        document.body.style.overflow = 'hidden';
        form.reset();
        successEl.style.display = 'none';
        form.style.display = '';
        setRating(5);
    }

    function closeModal() {
        overlay.classList.remove('active');
        document.body.style.overflow = '';
    }

    openBtn.addEventListener('click', openModal);
    closeBtn.addEventListener('click', closeModal);
    overlay.addEventListener('click', function(e) { if (e.target === overlay) closeModal(); });

    function setRating(val) {
        ratingInput.value = val;
        stars.forEach(function(s) {
            s.classList.toggle('active', parseInt(s.dataset.value) <= val);
        });
    }

    stars.forEach(function(s) {
        s.addEventListener('click', function() { setRating(parseInt(s.dataset.value)); });
        s.addEventListener('mouseenter', function() {
            var v = parseInt(s.dataset.value);
            stars.forEach(function(x) { x.classList.toggle('active', parseInt(x.dataset.value) <= v); });
        });
    });

    document.getElementById('starRating').addEventListener('mouseleave', function() {
        setRating(parseInt(ratingInput.value));
    });

    form.addEventListener('submit', function(e) {
        e.preventDefault();
        var name = document.getElementById('reviewName').value.trim();
        var text = document.getElementById('reviewText').value.trim();
        var rating = parseInt(ratingInput.value);
        if (!name || !text) return;

        var btn = form.querySelector('button[type="submit"]');
        var originalText = btn.textContent;
        btn.disabled = true;
        btn.textContent = '...';

        var iframeName = 'review_iframe_' + Date.now();
        var iframe = document.createElement('iframe');
        iframe.name = iframeName;
        iframe.style.display = 'none';
        document.body.appendChild(iframe);

        var hiddenForm = document.createElement('form');
        hiddenForm.method = 'POST';
        hiddenForm.action = scriptUrl;
        hiddenForm.target = iframeName;

        var fields = { action: 'review', name: name, text: text, rating: rating };
        for (var key in fields) {
            var input = document.createElement('input');
            input.type = 'hidden';
            input.name = key;
            input.value = fields[key];
            hiddenForm.appendChild(input);
        }

        document.body.appendChild(hiddenForm);

        var done = false;
        function onSuccess() {
            if (done) return;
            done = true;
            try { document.body.removeChild(hiddenForm); } catch(ex) {}
            try { document.body.removeChild(iframe); } catch(ex) {}
            form.style.display = 'none';
            successEl.style.display = '';
        }

        iframe.onload = onSuccess;
        hiddenForm.submit();
        setTimeout(onSuccess, 5000);
    });
})();

// === Перемикач мови UA/EN ===
(function() {
    var translations = {
        uk: {
            logo_text: 'Бесарабський степ',
            nav_about: 'Про нас', nav_layout: 'Корпуси', nav_rooms: 'Номери', nav_gallery: 'Галерея',
            nav_checkpoint: 'Проїзд', nav_booking: 'Бронювання', nav_reviews: 'Відгуки', nav_contacts: 'Контакти',
            hero_title: 'Відпочинок біля моря<br>поруч з Одесою',
            hero_subtitle: 'Затишна база відпочинку для сімей, компаній і тих, хто хоче відпочити від міської метушні',
            hero_btn_book: 'Забронювати', hero_btn_more: 'Дізнатися більше',
            layout_title: 'Наявність номерів',
            layout_subtitle: 'Заброньовані номери підсвічуються червоним.',
            floor1_title: '1 этаж — Сімейні', floor2_title: '2 этаж — Для пар',
            plan_family: 'Сімейний', plan_family_plus: 'Сімейний+', plan_family_lux: 'Сімейний Люкс',
            plan_family_2: 'Сімейний 2', plan_lux_1: 'Люкс 1', plan_lux_2: 'Люкс 2', plan_family_plus_2: 'Сімейний+ 2',
            floor_tab_1: '1 поверх — Сімейні', floor_tab_2: '2 поверх — Люкс', floor_tab_3: '2 поверх (Бокові кімнати)',
            cal_family: 'Сімейний', cal_family_plus: 'Сімейний+', cal_family_lux: 'Сімейний Люкс',
            cal_lux_1: 'Люкс 1', cal_lux_2: 'Люкс 2', cal_family_2: 'Сімейний 2', cal_family_plus_2: 'Сімейний+ 2',
            wd_mon: 'Пн', wd_tue: 'Вт', wd_wed: 'Ср', wd_thu: 'Чт', wd_fri: 'Пт', wd_sat: 'Сб', wd_sun: 'Нд',
            checkpoint_heading: 'Проїзд через КПП «Паланка»',
            checkpoint_warning: 'Важливо для чоловіків 18-60 років',
            checkpoint_alert: '<strong>До нашої бази можна доїхати лише через транзитну ділянку траси Одеса–Рені в районі с. Паланка (територія Молдови).</strong> Альтернативний міст через Дністровський лиман пошкоджений внаслідок ракетних ударів.',
            checkpoint_who_title: 'Хто може проїхати без дозволу:',
            checkpoint_who_1: 'Жінки та чоловіки старші 60 / молодші 18 років — <strong>вільно за паспортом</strong>',
            checkpoint_who_2: 'Особи з дійсною візою або дозволом на виїзд за кордон (загранпаспорт + віза)',
            checkpoint_men_title: '📋 Що потрібно чоловікам 18-60 років:',
            checkpoint_men_text: 'Проїзд дозволений <strong>лише за наявності</strong> однієї з умов:',
            checkpoint_men_1: '<strong>Законні підстави для виїзду за кордон</strong> — загранпаспорт + віза/дозвіл на в\'їзд в іншу країну',
            checkpoint_men_2: '<strong>Дозвіл від 25 прикордонного загону</strong> — оформлюється заздалегідь',
            checkpoint_how_title: '📝 Як отримати дозвіл (покрокова інструкція):',
            checkpoint_how_1: 'Напишіть заяву з вказівкою:',
            checkpoint_how_1a: 'ПІБ, дата народження',
            checkpoint_how_1b: 'Мета поїздки (відпочинок, база відпочинку «Бесарабський степ»)',
            checkpoint_how_1c: 'Бажані дати проїзду',
            checkpoint_how_2: 'Додайте копії:',
            checkpoint_how_2a: 'Паспорта громадянина України (1-2 сторінки)',
            checkpoint_how_2b: 'Військово-облікових документів (для військовозобов\'язаних)',
            checkpoint_how_2c: 'Документів, що підтверджують мету (бронювання житла, путівка)',
            checkpoint_how_3: 'Надішліть на email:',
            checkpoint_how_4: 'Чекайте відповідь — <strong>до 3 робочих днів</strong>',
            checkpoint_valid_title: '⏰ Термін дії дозволу:',
            checkpoint_valid_1: '<strong>До 1 року</strong> (з 01.11.2025, раніше було 6 місяців)',
            checkpoint_valid_2: 'Термін вказується відповідно до заявленої мети (наприклад, на 2 тижні відпочинку)',
            checkpoint_army_title: '🪖 Військовим:',
            checkpoint_army_1: 'Мати при собі військовий квиток або службове посвідчення',
            checkpoint_army_2: '<strong>Обов\'язково мати записку про звільнення</strong> від командування',
            checkpoint_army_3: 'Бронювання або відстрочка від мобілізації <strong>не є підставою</strong> для вільного проїзду — потрібен дозвіл',
            checkpoint_tips_title: '💡 Корисні поради:',
            checkpoint_tips_1: 'На КПП Маяки беріть талон з кількістю пасажирів',
            checkpoint_tips_2: 'Не зупиняйтесь та не паркуйтесь в зоні Маяків',
            checkpoint_tips_3: 'Майте при собі документи на авто (техпаспорт, страхування «Зелена карта»)',
            checkpoint_tips_4: 'Спори вирішуються на місці — з прикордонником краще не сперечатись',
            checkpoint_tips_5: '<strong>Радимо заздалегідь надіслати документи для оформлення дозволу</strong>',
            checkpoint_contacts_title: '📞 Контакти 25 прикордонного загону:',
            checkpoint_contacts_email: 'Email:', checkpoint_contacts_phone: 'Телефон:', checkpoint_contacts_address: 'Адреса:',
            about_title: 'Про нашу базу',
            about_p1: 'База відпочинку «Бесарабський степ» розташована в мальовничому місці Чорного моря, всього в 30 хвилинах їзди від Одеси. Ми пропонуємо комфортне розміщення в затишних котеджах і номерах з видом на море.',
            about_p2: 'На території бази є власний пляж, дитячий майданчик, зона барбекю та багато іншого для вашого комфортного відпочинку.',
            feature1_title: 'Власний пляж', feature1_text: 'Чистий піщаний пляж зі зручним заходом у море',
            feature2_title: 'Затишні котеджі', feature2_text: 'Котеджі від 2 до 8 осіб з усіма зручностями',
            feature3_title: 'Зона барбекю', feature3_text: 'Мангали та альтанки для вечірніх посиденьок',
            feature4_title: 'Для дітей', feature4_text: 'Дитячий майданчик та анімація в сезон',
            rooms_title: 'Номери та котеджі',
            room_standard_title: 'Стандарт', room_standard_desc: 'Затишний двомісний номер з видом на територію. Ванна кімната, кондиціонер, Wi-Fi.',
            room_standard_guests: '2 гості', room_standard_area: '20 м²', room_standard_ac: 'Кондиціонер', room_standard_price: 'від 1 500 грн',
            room_cottage_title: 'Котедж', room_cottage_desc: 'Просторий котедж для сім\'ї. Дві спальні, кухня, тераса з видом на море.',
            room_cottage_guests: '4-6 гостей', room_cottage_area: '50 м²', room_cottage_kitchen: 'Кухня', room_cottage_price: 'від 4 000 грн',
            room_lux_title: 'Люкс', room_lux_desc: 'Преміальний котедж з панорамним видом на море. Джакузи, три спальні, простора вітальня.',
            room_lux_guests: '6-8 гостей', room_lux_area: '80 м²', room_lux_jacuzzi: 'Джакузи', room_lux_price: 'від 7 000 грн',
            per_day: '/добу',
            gallery_title: 'Галерея',
            gallery_all: 'Все', gallery_territory: 'Територія', gallery_rooms: 'Номери', gallery_beach: 'Пляж',
            gallery_cap_1: 'Територія бази', gallery_cap_2: 'Наш пляж', gallery_cap_3: 'Номер Стандарт',
            gallery_cap_4: 'Зелена зона', gallery_cap_5: 'Котедж — вітальня', gallery_cap_6: 'Море',
            gallery_cap_7: 'Зона барбекю', gallery_cap_8: 'Кухня в котеджі',
            checkpoint_title: 'Як доїхати',
            booking_title: 'Бронювання',
            booking_how_title: 'Як забронювати?',
            booking_step_1: 'Оберіть зручні дати та тип розміщення',
            booking_step_2: 'Заповніть форму або зателефонуйте нам',
            booking_step_3: 'Ми підтвердимо бронювання протягом 1 години',
            booking_step_4: 'Внесіть передоплату для гарантії броні',
            booking_phone_1: '📞 Телефон:', booking_phone_2: '📞 Телефон:',
            booking_viber_label: 'Viber:', booking_viber_link: 'Написати в Viber',
            booking_form_name: 'Ваше ім\'я', booking_form_name_ph: 'Олександр Олександрович',
            booking_form_phone: 'Телефон',
            booking_form_type: 'Тип розміщення', booking_form_type_def: 'Оберіть тип',
            booking_form_grp1: '1 поверх — Сімейні',
            booking_form_opt1: 'Сімейний — від 1 500 грн', booking_form_opt2: 'Сімейний+ — від 2 000 грн', booking_form_opt3: 'Сімейний Люкс — від 3 000 грн',
            booking_form_grp2: '2 поверх — Сімейні',
            booking_form_opt4: 'Сімейний 2 — від 1 500 грн', booking_form_opt5: 'Сімейний+ 2 — від 2 000 грн',
            booking_form_grp3: '2 поверх — Люкс (2 кімнати)',
            booking_form_opt6: 'Люкс 1 — від 2 500 грн', booking_form_opt7: 'Люкс 2 — від 2 500 грн',
            booking_form_checkin: 'Заїзд', booking_form_checkout: 'Виїзд',
            booking_form_guests: 'Кількість гостей',
            booking_form_comment: 'Коментар', booking_form_comment_ph: 'Особливі побажання...',
            booking_form_submit: 'Надіслати заявку',
            map_address_title: '📍 Адреса', map_address: 'Одеська область, с. Косяківка',
            map_routes_title: 'Як доїхати', map_from_odessa: 'З Одеси:',
            map_from_odessa_text: 'від 1,5 до 2,5 годин в залежності від завантаженості дороги',
            map_transfer_title: '🚌 Трансфер',
            map_transfer_text: 'Трансфер організовує окрема людина. Номер телефону для зв\'язку уточнюйте у нас.',
            reviews_title: 'Відгуки гостей',
            contacts_title: 'Контакти',
            contact_phone: 'Телефон', contact_viber: 'Viber', contact_viber_link: 'Написати в Viber',
            footer_tagline: 'Відпочинок біля моря поруч з Одесою',
            footer_copyright: '© 2026 База відпочинку «Бесарабський степ». Усі права захищені.',
            modal_ok: 'Зрозуміло',
            modal_conflict_title: 'Ці дати вже зайняті!',
            modal_conflict_text: 'Обрані вами дати частково або повністю збігаються з існуючими бронюваннями:',
            modal_conflict_hint: 'Спробуйте обрати інші дати або зателефонуйте нам для уточнення.',
            reviews_write_btn: 'Написати відгук',
            review_form_title: 'Залишити відгук',
            review_form_name: 'Ваше ім\'я', review_form_name_ph: 'Олександр',
            review_form_rating: 'Оцінка',
            review_form_text: 'Ваш відгук', review_form_text_ph: 'Розкажіть про свій досвід відпочинку...',
            review_form_submit: 'Надіслати відгук',
            review_form_success: 'Дякуємо! Ваш відгук надіслано і з\'явиться на сайті після перевірки.'
        },
        en: {
            logo_text: 'Bessarabskyi Steppe',
            nav_about: 'About', nav_layout: 'Buildings', nav_rooms: 'Rooms', nav_gallery: 'Gallery',
            nav_checkpoint: 'Directions', nav_booking: 'Booking', nav_reviews: 'Reviews', nav_contacts: 'Contacts',
            hero_title: 'Seaside retreat<br>near Odessa',
            hero_subtitle: 'A cozy recreation base for families, groups, and anyone looking to escape the city hustle',
            hero_btn_book: 'Book now', hero_btn_more: 'Learn more',
            layout_title: 'Room availability',
            layout_subtitle: 'Booked rooms are highlighted in red.',
            floor1_title: '1st Floor — Family', floor2_title: '2nd Floor — Couples',
            plan_family: 'Family', plan_family_plus: 'Family+', plan_family_lux: 'Family Lux',
            plan_family_2: 'Family 2', plan_lux_1: 'Lux 1', plan_lux_2: 'Lux 2', plan_family_plus_2: 'Family+ 2',
            floor_tab_1: '1st Floor — Family', floor_tab_2: '2nd Floor — Lux', floor_tab_3: '2nd Floor (Side Rooms)',
            cal_family: 'Family', cal_family_plus: 'Family+', cal_family_lux: 'Family Lux',
            cal_lux_1: 'Lux 1', cal_lux_2: 'Lux 2', cal_family_2: 'Family 2', cal_family_plus_2: 'Family+ 2',
            wd_mon: 'Mo', wd_tue: 'Tu', wd_wed: 'We', wd_thu: 'Th', wd_fri: 'Fr', wd_sat: 'Sa', wd_sun: 'Su',
            checkpoint_heading: 'Travel through Palanka Checkpoint',
            checkpoint_warning: 'Important for men aged 18-60',
            checkpoint_alert: '<strong>Our base can only be reached via the transit section of the Odessa–Reni highway near Palanka village (Moldova territory).</strong> The alternative bridge across the Dniester Liman was damaged by missile strikes.',
            checkpoint_who_title: 'Who can pass without a permit:',
            checkpoint_who_1: 'Women and men over 60 / under 18 — <strong>freely with passport</strong>',
            checkpoint_who_2: 'Persons with a valid visa or exit permit abroad (international passport + visa)',
            checkpoint_men_title: '📋 What men aged 18-60 need:',
            checkpoint_men_text: 'Crossing is allowed <strong>only if one of the following conditions</strong> is met:',
            checkpoint_men_1: '<strong>Legal grounds for leaving the country</strong> — international passport + visa/entry permit to another country',
            checkpoint_men_2: '<strong>Permit from the 25th Border Unit</strong> — issued in advance',
            checkpoint_how_title: '📝 How to get a permit (step-by-step):',
            checkpoint_how_1: 'Write an application specifying:',
            checkpoint_how_1a: 'Full name, date of birth',
            checkpoint_how_1b: 'Purpose of travel (vacation, Bessarabskyi Steppe recreation base)',
            checkpoint_how_1c: 'Desired travel dates',
            checkpoint_how_2: 'Attach copies of:',
            checkpoint_how_2a: 'Ukrainian citizen passport (pages 1-2)',
            checkpoint_how_2b: 'Military registration documents (for military-age persons)',
            checkpoint_how_2c: 'Documents confirming purpose (accommodation booking, travel package)',
            checkpoint_how_3: 'Send to email:',
            checkpoint_how_4: 'Wait for response — <strong>up to 3 business days</strong>',
            checkpoint_valid_title: '⏰ Permit validity:',
            checkpoint_valid_1: '<strong>Up to 1 year</strong> (since 01.11.2025, previously 6 months)',
            checkpoint_valid_2: 'Validity is set according to stated purpose (e.g., for 2 weeks of vacation)',
            checkpoint_army_title: '🪖 For military personnel:',
            checkpoint_army_1: 'Carry military ID or service certificate',
            checkpoint_army_2: '<strong>Must have a release note</strong> from command',
            checkpoint_army_3: 'Booking or mobilization deferral is <strong>not grounds</strong> for free passage — a permit is required',
            checkpoint_tips_title: '💡 Useful tips:',
            checkpoint_tips_1: 'At Mayaky checkpoint, take a ticket with passenger count',
            checkpoint_tips_2: 'Do not stop or park in the Mayaky zone',
            checkpoint_tips_3: 'Carry vehicle documents (registration, Green Card insurance)',
            checkpoint_tips_4: 'Disputes are resolved on site — better not argue with border guards',
            checkpoint_tips_5: '<strong>We recommend sending documents in advance for permit processing</strong>',
            checkpoint_contacts_title: '📞 Contact 25th Border Unit:',
            checkpoint_contacts_email: 'Email:', checkpoint_contacts_phone: 'Phone:', checkpoint_contacts_address: 'Address:',
            about_title: 'About us',
            about_p1: 'Bessarabskyi Steppe recreation base is located in a picturesque spot on the Black Sea, just 30 minutes drive from Odessa. We offer comfortable accommodation in cozy cottages and rooms with sea views.',
            about_p2: 'The facility features a private beach, playground, BBQ area, and much more for your comfortable stay.',
            feature1_title: 'Private beach', feature1_text: 'Clean sandy beach with easy sea access',
            feature2_title: 'Cozy cottages', feature2_text: 'Cottages for 2 to 8 guests with all amenities',
            feature3_title: 'BBQ area', feature3_text: 'Grills and gazebos for evening gatherings',
            feature4_title: 'For children', feature4_text: 'Playground and seasonal animation',
            rooms_title: 'Rooms & Cottages',
            room_standard_title: 'Standard', room_standard_desc: 'Cozy double room with territory view. Bathroom, air conditioning, Wi-Fi.',
            room_standard_guests: '2 guests', room_standard_area: '20 m²', room_standard_ac: 'Air conditioning', room_standard_price: 'from 1,500 UAH',
            room_cottage_title: 'Cottage', room_cottage_desc: 'Spacious family cottage. Two bedrooms, kitchen, terrace with sea view.',
            room_cottage_guests: '4-6 guests', room_cottage_area: '50 m²', room_cottage_kitchen: 'Kitchen', room_cottage_price: 'from 4,000 UAH',
            room_lux_title: 'Deluxe', room_lux_desc: 'Premium cottage with panoramic sea view. Jacuzzi, three bedrooms, spacious living room.',
            room_lux_guests: '6-8 guests', room_lux_area: '80 m²', room_lux_jacuzzi: 'Jacuzzi', room_lux_price: 'from 7,000 UAH',
            per_day: '/day',
            gallery_title: 'Gallery',
            gallery_all: 'All', gallery_territory: 'Territory', gallery_rooms: 'Rooms', gallery_beach: 'Beach',
            gallery_cap_1: 'Base territory', gallery_cap_2: 'Our beach', gallery_cap_3: 'Standard room',
            gallery_cap_4: 'Green zone', gallery_cap_5: 'Cottage — living room', gallery_cap_6: 'Sea',
            gallery_cap_7: 'BBQ area', gallery_cap_8: 'Kitchen in cottage',
            checkpoint_title: 'How to get here',
            booking_title: 'Booking',
            booking_how_title: 'How to book?',
            booking_step_1: 'Choose convenient dates and accommodation type',
            booking_step_2: 'Fill out the form or call us',
            booking_step_3: 'We will confirm your booking within 1 hour',
            booking_step_4: 'Make a prepayment to guarantee your booking',
            booking_phone_1: '📞 Phone:', booking_phone_2: '📞 Phone:',
            booking_viber_label: 'Viber:', booking_viber_link: 'Write on Viber',
            booking_form_name: 'Your name', booking_form_name_ph: 'John Smith',
            booking_form_phone: 'Phone',
            booking_form_type: 'Accommodation type', booking_form_type_def: 'Select type',
            booking_form_grp1: '1st Floor — Family',
            booking_form_opt1: 'Family — from 1,500 UAH', booking_form_opt2: 'Family+ — from 2,000 UAH', booking_form_opt3: 'Family Lux — from 3,000 UAH',
            booking_form_grp2: '2nd Floor — Family',
            booking_form_opt4: 'Family 2 — from 1,500 UAH', booking_form_opt5: 'Family+ 2 — from 2,000 UAH',
            booking_form_grp3: '2nd Floor — Lux (2 rooms)',
            booking_form_opt6: 'Lux 1 — from 2,500 UAH', booking_form_opt7: 'Lux 2 — from 2,500 UAH',
            booking_form_checkin: 'Check-in', booking_form_checkout: 'Check-out',
            booking_form_guests: 'Number of guests',
            booking_form_comment: 'Comment', booking_form_comment_ph: 'Special requests...',
            booking_form_submit: 'Submit request',
            map_address_title: '📍 Address', map_address: 'Odessa region, Kosyakivka village',
            map_routes_title: 'How to get here', map_from_odessa: 'From Odessa:',
            map_from_odessa_text: '1.5 to 2.5 hours depending on traffic',
            map_transfer_title: '🚌 Transfer',
            map_transfer_text: 'Transfer is arranged by a separate person. Contact us for the phone number.',
            reviews_title: 'Guest reviews',
            contacts_title: 'Contacts',
            contact_phone: 'Phone', contact_viber: 'Viber', contact_viber_link: 'Write on Viber',
            footer_tagline: 'Seaside retreat near Odessa',
            footer_copyright: '© 2026 Bessarabskyi Steppe Recreation Base. All rights reserved.',
            modal_ok: 'Got it',
            modal_conflict_title: 'These dates are already booked!',
            modal_conflict_text: 'Your selected dates partially or fully overlap with existing bookings:',
            modal_conflict_hint: 'Try selecting different dates or call us for details.',
            reviews_write_btn: 'Write a review',
            review_form_title: 'Leave a review',
            review_form_name: 'Your name', review_form_name_ph: 'John',
            review_form_rating: 'Rating',
            review_form_text: 'Your review', review_form_text_ph: 'Tell us about your stay...',
            review_form_submit: 'Submit review',
            review_form_success: 'Thank you! Your review has been submitted and will appear on the site after moderation.'
        }
    };

    var langBtns = document.querySelectorAll('.lang-btn');
    var savedLang = localStorage.getItem('lang') || 'uk';

    function applyLang(lang) {
        var t = translations[lang];
        if (!t) return;
        document.querySelectorAll('[data-i18n]').forEach(function(el) {
            var key = el.getAttribute('data-i18n');
            if (t[key]) el.innerHTML = t[key];
        });
        document.querySelectorAll('[data-i18n-placeholder]').forEach(function(el) {
            var key = el.getAttribute('data-i18n-placeholder');
            if (t[key]) el.placeholder = t[key];
        });
        document.querySelectorAll('optgroup[data-i18n]').forEach(function(el) {
            var key = el.getAttribute('data-i18n');
            if (t[key]) el.label = t[key];
        });
        langBtns.forEach(function(btn) { btn.classList.toggle('active', btn.dataset.lang === lang); });
        document.documentElement.lang = lang === 'uk' ? 'uk' : 'en';
        localStorage.setItem('lang', lang);
        try { if (window.renderAllCalendars) window.renderAllCalendars(); } catch(e) { console.error('renderCal error', e); }
        try { if (window.renderReviews) window.renderReviews(); } catch(e) { console.error('renderReviews error', e); }
    }

    langBtns.forEach(function(btn) {
        btn.addEventListener('click', function() { applyLang(btn.dataset.lang); });
    });

    applyLang(savedLang);
})();

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
            
            var SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxh4TjkSjlmQugwWgkr9WeXUamUARU_s9Ub7katGh8pzQ65s3elul-iJNri5PFu8Rzm/exec';
            
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

    floorTabs.forEach(function(tab) {
        tab.addEventListener('click', function() {
            floorTabs.forEach(function(t) { t.classList.remove('floor-tab--active'); });
            tab.classList.add('floor-tab--active');

            var floor = tab.getAttribute('data-floor');
            if (floor === '1') {
                floor1.style.display = '';
                floor2.style.display = 'none';
            } else {
                floor1.style.display = 'none';
                floor2.style.display = '';
            }
        });
    });

    // === 6 календарів (по одному на тип номера) ===
    var calScriptUrl = 'https://script.google.com/macros/s/AKfycbxh4TjkSjlmQugwWgkr9WeXUamUARU_s9Ub7katGh8pzQ65s3elul-iJNri5PFu8Rzm/exec';
    var bookedDates = [];

    var monthNames = ['Січень', 'Лютий', 'Березень', 'Квітень', 'Травень', 'Червень',
        'Липень', 'Серпень', 'Вересень', 'Жовтень', 'Листопад', 'Грудень'];

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

        cal.monthEl.textContent = monthNames[cal.month] + ' ' + cal.year;

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
});

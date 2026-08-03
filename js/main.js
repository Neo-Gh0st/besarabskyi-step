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
        var labels = { standart: 'Стандарт', cottage: 'Котедж', lux: 'Люкс' };
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
            
            var SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwAJCZfTBiJ-QA40521pJ8fQGSYojwsirXLSMwMibu3Mo3m57rRGclPwhrG4uPJ0oewHg/exec';
            
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

    // Календарь забронированных дат
    var calScriptUrl = 'https://script.google.com/macros/s/AKfycbwAJCZfTBiJ-QA40521pJ8fQGSYojwsirXLSMwMibu3Mo3m57rRGclPwhrG4uPJ0oewHg/exec';
    var calDays = document.getElementById('calDays');
    var calMonth = document.getElementById('calMonth');
    var calPrev = document.getElementById('calPrev');
    var calNext = document.getElementById('calNext');
    var bookedDates = [];
    var currentMonth = new Date().getMonth();
    var currentYear = new Date().getFullYear();

    var monthNames = ['Січень', 'Лютий', 'Березень', 'Квітень', 'Травень', 'Червень',
        'Липень', 'Серпень', 'Вересень', 'Жовтень', 'Листопад', 'Грудень'];

    function renderCalendar() {
        if (!calDays || !calMonth) return;

        calMonth.textContent = monthNames[currentMonth] + ' ' + currentYear;

        var firstDay = new Date(currentYear, currentMonth, 1);
        var lastDay = new Date(currentYear, currentMonth + 1, 0);
        var startDay = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1;
        var daysInMonth = lastDay.getDate();
        var today = new Date();
        today.setHours(0, 0, 0, 0);

        var html = '';

        for (var i = 0; i < startDay; i++) {
            html += '<div class="calendar__day calendar__day--empty"></div>';
        }

        for (var d = 1; d <= daysInMonth; d++) {
            var date = new Date(currentYear, currentMonth, d);
            var dateStr = currentYear + '-' + String(currentMonth + 1).padStart(2, '0') + '-' + String(d).padStart(2, '0');
            var cls = 'calendar__day';

            if (date < today) {
                cls += ' calendar__day--past';
            } else if (isBooked(dateStr)) {
                cls += ' calendar__day--booked';
            } else {
                cls += ' calendar__day--free';
            }

            if (date.getTime() === today.getTime()) {
                cls += ' calendar__day--today';
            }

            html += '<div class="' + cls + '" title="' + dateStr + '">' + d + '</div>';
        }

        calDays.innerHTML = html;
    }

    function isBooked(dateStr) {
        for (var i = 0; i < bookedDates.length; i++) {
            var item = bookedDates[i];
            if (dateStr >= item.from && dateStr <= item.to) {
                return true;
            }
        }
        return false;
    }

    if (calPrev) {
        calPrev.addEventListener('click', function() {
            currentMonth--;
            if (currentMonth < 0) {
                currentMonth = 11;
                currentYear--;
            }
            renderCalendar();
        });
    }

    if (calNext) {
        calNext.addEventListener('click', function() {
            currentMonth++;
            if (currentMonth > 11) {
                currentMonth = 0;
                currentYear++;
            }
            renderCalendar();
        });
    }

    // Сначала рендерим пустой календарь
    renderCalendar();

    // Завантажуємо заброньовані дати через fetch (Google Apps Script робить 302 redirect)
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
                renderCalendar();
                updateFloorPlan();
            })
            .catch(function() {
                // Fallback: JSONP
                loadBookedDatesJSONP();
            });
    }

    function loadBookedDatesJSONP() {
        var callbackName = 'calCb_' + Date.now();
        window[callbackName] = function(data) {
            delete window[callbackName];
            bookedDates = data || [];
            renderCalendar();
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

        var parts = ['Left', 'Top', 'Right'];
        var floors = [1, 2];
        var roomMap = { Left: 'standart', Top: 'cottage', Right: 'lux' };

        for (var f = 0; f < floors.length; f++) {
            for (var p = 0; p < parts.length; p++) {
                var el = document.getElementById('plan' + floors[f] + parts[p]);
                if (!el) continue;
                var roomType = roomMap[parts[p]];
                if (bookedRooms[roomType]) {
                    el.classList.add('booked');
                } else {
                    el.classList.remove('booked');
                }
            }
        }
    }
});

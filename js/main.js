document.addEventListener('DOMContentLoaded', function() {
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
    if (bookingForm) {
        bookingForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            var submitBtn = bookingForm.querySelector('button[type="submit"]');
            var originalText = submitBtn.textContent;
            submitBtn.textContent = 'Надсилання...';
            submitBtn.disabled = true;
            
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
            
    var SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzc8f_NCYenApYdXBwiPuPdn8BJeomA6y8i0oimzUCbPJHWBg-UD2fGLDF40E0OZMTxNA/exec';
            
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
            
            iframe.onload = function() {
                document.body.removeChild(form);
                document.body.removeChild(iframe);
                alert('Дякуємо, ' + data.name + '! Ваша заявку надіслано.\n\nМи зв\'яжемося з вами найближчим часом.');
                bookingForm.reset();
                submitBtn.textContent = originalText;
                submitBtn.disabled = false;
            };
            
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
    var SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzc8f_NCYenApYdXBwiPuPdn8BJeomA6y8i0oimzUCbPJHWBg-UD2fGLDF40E0OZMTxNA/exec';
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

    var calCallback = 'calCallback_' + Date.now();
    window[calCallback] = function(data) {
        delete window[calCallback];
        if (calScript.parentNode) calScript.parentNode.removeChild(calScript);
        bookedDates = data || [];
        renderCalendar();
    };
    var calScript = document.createElement('script');
    calScript.src = SCRIPT_URL + '?callback=' + calCallback + '&action=booked';
    calScript.onerror = function() {
        delete window[calCallback];
        if (calDays) calDays.innerHTML = '<div style="grid-column:1/8;text-align:center;color:var(--gray);padding:20px;">Завантаження...</div>';
    };
    document.body.appendChild(calScript);
});

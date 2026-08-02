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
            submitBtn.textContent = 'Отправка...';
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
            
            var SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbx3qix4UVw4tEZi0kQQq36EQB3wSvqDTfj5Uq2dfu9T48uO2-rsmEjDn6MDb0RCvKzt/exec';
            
            var params = new URLSearchParams(data).toString();
            var callbackName = 'cb_' + Date.now();
            
            window[callbackName] = function(result) {
                delete window[callbackName];
                document.body.removeChild(script);
                
                if (result.status === 'ok') {
                    alert('Спасибо, ' + data.name + '! Ваша заявка отправлена.\n\nМы свяжемся с вами в ближайшее время.');
                    bookingForm.reset();
                } else {
                    alert('Ошибка отправки. Попробуйте позвонить нам: 067 264 10 17');
                }
                
                submitBtn.textContent = originalText;
                submitBtn.disabled = false;
            };
            
            var script = document.createElement('script');
            script.src = SCRIPT_URL + '?' + params + '&callback=' + callbackName;
            script.onerror = function() {
                delete window[callbackName];
                alert('Ошибка отправки. Попробуйте позвонить нам: 067 264 10 17');
                submitBtn.textContent = originalText;
                submitBtn.disabled = false;
            };
            document.body.appendChild(script);
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
});

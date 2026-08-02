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
            
            var formData = new FormData(bookingForm);
            var name = formData.get('name');
            var phone = formData.get('phone');
            var roomType = formData.get('roomType');
            var dateIn = formData.get('dateIn');
            var dateOut = formData.get('dateOut');
            var guests = formData.get('guests');
            
            var roomNames = {
                'standart': 'Стандарт',
                'cottage': 'Коттедж',
                'lux': 'Люкс'
            };
            
            var message = 'Здравствуйте! Хочу забронировать:\n\n';
            message += 'Имя: ' + name + '\n';
            message += 'Телефон: ' + phone + '\n';
            message += 'Тип: ' + (roomNames[roomType] || roomType) + '\n';
            message += 'Заезд: ' + dateIn + '\n';
            message += 'Выезд: ' + dateOut + '\n';
            message += 'Гостей: ' + guests + '\n';
            
            var comment = formData.get('comment');
            if (comment) {
                message += 'Комментарий: ' + comment + '\n';
            }
            
            message += '\nЖду подтверждения!';
            
            alert('Спасибо, ' + name + '! Ваша заявка отправлена.\n\nМы свяжемся с вами в ближайшее время.');
            bookingForm.reset();
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

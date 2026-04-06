const app = {
    mode: 'user', 
    user: null,
    tempFile: { data: null, type: null },
    ADMIN_CODE: "2092010", // الرمز السري الحصري لمحمد بركات
    
    data: {
        posts: JSON.parse(localStorage.getItem('mb_posts')) || [],
        users: JSON.parse(localStorage.getItem('mb_users')) || [],
        chat: JSON.parse(localStorage.getItem('mb_chat')) || [],
        subs: JSON.parse(localStorage.getItem('mb_subs')) || []
    },

    showToast: function(m) {
        const c = document.getElementById('toast-container');
        const t = document.createElement('div'); t.className = 'toast'; t.innerText = m;
        c.appendChild(t); setTimeout(() => t.remove(), 3000);
    },

    handleAvatar: function(i) {
        const r = new FileReader(); r.onload = (e) => document.getElementById('avatar-preview').src = e.target.result;
        r.readAsDataURL(i.files[0]);
    },

    setMode: function(m) {
        this.mode = m;
        document.getElementById('entry-page').style.display = 'none';
        document.getElementById('auth-page').style.display = 'block';
        document.getElementById('auth-title').innerText = (m === 'admin' ? "تسجيل دخول المدير 👑" : "دخول الأعضاء");
        document.getElementById('admin-pass-container').style.display = (m === 'admin' ? 'block' : 'none');
    },

    login: function() {
        const n = document.getElementById('reg-name').value;
        const p = document.getElementById('reg-phone').value;
        const c = document.getElementById('admin-code').value;
        const av = document.getElementById('avatar-preview').src;

        if(!n || !p) return this.showToast("يا محمد، كمل البيانات الأول!");

        // نظام الحماية:
        if(this.mode === 'admin') {
            if(c !== this.ADMIN_CODE) {
                return this.showToast("الرمز السري غلط! أنت مش محمد بركات؟");
            }
            this.user = { name: n, phone: p, role: 'Admin', avatar: av };
        } else {
            // لو مستخدم عادي بيسجل، نشوف لو كان متسجل قبل كدة ببياناته الأصلية
            const saved = this.data.users.find(u => u.phone === p);
            if (saved) {
                this.user = saved;
            } else {
                this.user = { name: n, phone: p, role: 'طالب', avatar: av };
            }
        }

        // حفظ المستخدم الجديد
        if(!this.data.users.find(u => u.phone === p)) {
            this.data.users.push(this.user);
            this.save('users');
        }
        this.runApp();
    },

    runApp: function() {
        document.getElementById('auth-page').style.display = 'none';
        document.getElementById('app-main').style.display = 'block';
        document.getElementById('user-badge').innerText = this.user.role;
        document.getElementById('my-prof-img').src = this.user.avatar;
        document.getElementById('prof-name').innerText = this.user.name;
        document.getElementById('prof-role-badge').innerText = "الرتبة: " + this.user.role;

        // إظهار الصلاحيات بناءً على النوع الحقيقي مش على الاختيار بس
        if(this.user.role === 'Admin') {
            document.getElementById('admin-nav').style.display = 'block';
            document.getElementById('sub-nav').style.display = 'block';
        } else if(this.user.role === 'أستاذ') {
            document.getElementById('sub-nav').style.display = 'block';
        }
        
        this.nav('home');
        this.showToast(`نورت المنصة يا ${this.user.name}`);
    },

    nav: function(p) {
        document.querySelectorAll('.page').forEach(s => s.style.display = 'none');
        document.getElementById(p + '-screen').style.display = 'block';
        document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
        if(p === 'home') this.renderPosts();
        if(p === 'admin') this.renderAdmin();
        if(p === 'chat') this.renderChat();
        if(p === 'sub') this.renderSubs();
    },

    handleFile: function(i) {
        const f = i.files[0]; const r = new FileReader();
        r.onload = (e) => {
            this.tempFile = { data: e.target.result, type: f.type.split('/')[0] };
            document.getElementById('file-status').innerText = "✅ الملف جاهز للنشر";
        }; r.readAsDataURL(f);
    },

    createPost: function() {
        const t = document.getElementById('p-text').value;
        if(!t && !this.tempFile.data) return;
        this.data.posts.unshift({
            id: Date.now(), name: this.user.name, avatar: this.user.avatar, role: this.user.role,
            text: t, file: this.tempFile.data, fileType: this.tempFile.type, likes: 0
        });
        this.save('posts');
        this.showToast("تم النشر بنجاح!");
        document.getElementById('p-text').value = "";
        this.tempFile = { data: null, type: null };
        this.nav('home');
    },

    renderPosts: function() {
        const f = document.getElementById('feed-items');
        f.innerHTML = this.data.posts.map(p => `
            <div class="post glass-card">
                <div style="display:flex; align-items:center; gap:10px; margin-bottom:12px;">
                    <img src="${p.avatar}" style="width:45px; height:45px; border-radius:50%; border:1px solid var(--gold);">
                    <b>${p.name} <br> <span class="badge" style="font-size:10px;">${p.role}</span></b>
                </div>
                <p style="white-space: pre-wrap;">${p.text}</p>
                ${p.file ? (p.fileType === 'image' ? `<img src="${p.file}" class="post-media">` : `<video src="${p.file}" controls class="post-media"></video>`) : ''}
                <div style="margin-top:15px; display:flex; gap:15px; border-top:1px solid rgba(255,255,255,0.1); padding-top:10px;">
                    <button class="main-btn secondary" style="width:auto; padding:5px 20px;" onclick="app.like(${p.id})">❤️ ${p.likes || 0}</button>
                    ${p.file ? `<a href="${p.file}" download="MB_FILE" class="badge" style="text-decoration:none; padding:10px;">⬇ تحميل</a>` : ''}
                    ${this.user.role === 'Admin' ? `<button onclick="app.delPost(${p.id})" style="color:#ff4444; background:none; border:none; cursor:pointer;">حذف</button>` : ''}
                </div>
            </div>
        `).join('');
    },

    like: function(id) {
        const p = this.data.posts.find(x => x.id === id);
        p.likes++; this.save('posts'); this.renderPosts();
    },

    delPost: function(id) {
        if(confirm('هل تريد حذف المنشور؟')) {
            this.data.posts = this.data.posts.filter(p => p.id !== id);
            this.save('posts'); this.renderPosts();
        }
    },

    sendChatMessage: function() {
        const i = document.getElementById('chat-input');
        if(!i.value) return;
        this.data.chat.push({ name: this.user.name, text: i.value, role: this.user.role });
        this.save('chat'); i.value = ""; this.renderChat();
    },

    renderChat: function() {
        const b = document.getElementById('chat-messages');
        b.innerHTML = this.data.chat.map(m => `
            <div class="msg-bubble" style="background:rgba(255,255,255,0.05); padding:10px; border-radius:15px; margin-bottom:8px; border-right:3px solid ${m.role === 'Admin' ? 'var(--gold)' : '#555'};">
                <small style="color:var(--gold);">${m.name}:</small><br>${m.text}
            </div>
        `).join('');
        b.scrollTop = b.scrollHeight;
    },

    renderAdmin: function() {
        document.getElementById('stat-u').innerText = this.data.users.length;
        document.getElementById('stat-p').innerText = this.data.posts.length;
        const l = document.getElementById('admin-user-list');
        l.innerHTML = this.data.users.map(u => `
            <div class="glass-card" style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px; padding:15px;">
                <div><b>${u.name}</b> <br> <small>${u.role}</small></div>
                <div>
                    ${u.role === 'طالب' ? `<button onclick="app.prom('${u.phone}')" style="color:var(--gold); background:none; border:none; cursor:pointer; font-weight:bold;">⬆ ترقية لأستاذ</button>` : ''}
                    ${u.phone !== this.user.phone ? `<button onclick="app.delU('${u.phone}')" style="color:red; background:none; border:none; margin-right:15px; cursor:pointer;">🗑 حذف</button>` : ''}
                </div>
            </div>
        `).join('');
    },

    delU: function(p) { 
        if(confirm('حذف المستخدم نهائياً؟')) {
            this.data.users = this.data.users.filter(u => u.phone !== p); 
            this.save('users'); this.renderAdmin(); 
        }
    },
    
    prom: function(p) { 
        this.data.users = this.data.users.map(u => u.phone === p ? {...u, role:'أستاذ'} : u); 
        this.save('users'); this.renderAdmin(); this.showToast("تم ترقية المستخدم لأستاذ بنجاح!");
    },

    renderSubs: function() {
        const l = document.getElementById('sub-list');
        const t = document.getElementById('admin-sub-tools');
        if(this.user.role === 'Admin') {
            t.style.display = 'block';
            document.getElementById('sub-teacher-select').innerHTML = this.data.users.filter(u => u.role === 'أستاذ').map(x => `<option value="${x.phone}">${x.name}</option>`).join('');
            l.innerHTML = this.data.subs.map(s => `<div class="sub-card"><b>📌 للمدرس: ${s.teacherName}</b> <br> المبلغ: ${s.amount} جنيه <br> البيان: ${s.note}</div>`).join('');
        } else {
            t.style.display = 'none';
            const mySubs = this.data.subs.filter(s => s.teacherPhone === this.user.phone);
            l.innerHTML = mySubs.length ? mySubs.map(s => `<div class="sub-card">💰 استلمت مبلغ: ${s.amount} ج <br> ملاحظة: ${s.note}</div>`).join('') : "لا توجد سجلات مالية لك.";
        }
    },

    addSubscription: function() {
        const ph = document.getElementById('sub-teacher-select').value;
        const am = document.getElementById('sub-amount').value;
        const nt = document.getElementById('sub-note').value;
        if(!ph || !am) return alert("اكمل البيانات المالية!");
        const t = this.data.users.find(u => u.phone === ph);
        this.data.subs.unshift({ teacherPhone: ph, teacherName: t.name, amount: am, note: nt });
        this.save('subs'); this.renderSubs(); this.showToast("تم تسجيل الدفعة في الخزينة");
    },

    save: function(k) { localStorage.setItem('mb_' + k, JSON.stringify(this.data[k])); },
    inviteWhatsApp: function() { window.open(`https://wa.me/?text=سجل الآن في منصة محمد بركات MB GOLD: ${window.location.href}`); }
};

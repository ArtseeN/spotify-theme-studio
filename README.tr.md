# Spotify Theme Studio

[English](README.md) · **Türkçe**

Spotify masaüstü uygulamasını kod yazmadan kişiselleştirmek için bir Windows uygulaması. Arka planda [Spicetify](https://spicetify.app) kullanır; kurulumu, yedeklemeyi ve geri almayı kendisi yapar.

## Özellikler

- **Tek tıkla kurulum**: Spicetify'ın son sürümünü indirip kurar.
- **Tema editörü**: 8 hazır tema, rastgele palet, 7 temel renk (istenirse 18 rengin hepsi), yazı tipi, köşe ve buton şekli. Değişiklikler canlı önizlemede anında görünür.
- **Arka plan**: Resim, GIF, video, internet adresi, çalan şarkının kapağı ya da tema renklerinden hareketli geçiş. Konum, bulanıklık, doygunluk, karartma, panel opaklığı ve buzlu cam. Resimden otomatik renk paleti.
- **Logo**: Üst çubuğa kendi resmin ya da adın (vurgu renginde geçişli yazı), istersen Ana sayfa butonunun yerine.
- **Düzen ve gizleme**: Panel boşluğu, yüzen oynatıcı, kaydırma çubuğu stili, kart animasyonu, yazı gölgesi, siyah-beyaz/yakınlaşan kapaklar; zil, arkadaşlar, Premium, mini oynatıcı gibi 9 öğeyi gizleme.
- **Şarkı sözleri**: Tema renkleri, vurgu rengi ya da Spotify'ın renkleri; küçük/normal/büyük yazı, sola ya da ortaya hizalama.
- **Discord**: Hem uygulamada hem Spotify'ın üst çubuğunda (zilin yanında) sade bir katılma butonu.
- **Akıllı geçiş**: Saate göre gündüz/gece renkleri ya da çalan şarkının albüm kapağına göre renk.
- **Temalarım**: Temaları kaydedip tek tıkla geri dönme; `SPS1.` paylaşım kodu ya da arka plan ve logoyu da taşıyan `.spstudio` dosyası.
- **Geri al / yinele** (Ctrl+Z / Ctrl+Y), **Ctrl+S** ile uygulama, dosyaları sürükleyip bırakma.
- **Hızlı uygulama**: Spotify zaten modlanmışsa yalnızca tema dosyaları yenilenir, Spotify birkaç saniyede yeniden açılır.
- **Otomatik yeniden uygulama**: Spotify güncellenince modlar silinir; uygulama arka planda bunu fark edip temayı yeniden uygular.
- **Geri alma**: Ayarlar → Orijinale dön, Spotify'ı dokunulmamış haline getirir.
- Türkçe ve İngilizce arayüz.

## Geliştirme

```bash
npm install
npm run dev      # Vite + Electron, sıcak yenilemeyle
npm start        # derleyip çalıştırır
npm run dist     # release/ klasörüne Windows kurulum dosyası üretir
```

## Nasıl çalışır

| Dosya | Görevi |
| --- | --- |
| `electron/main.js` | Pencere, sistem tepsisi, ayarlar, paylaşım kodu, güncelleme izleyici |
| `electron/spicetify.js` | Spicetify'ı indirme, kurma ve komutlarını çalıştırma |
| `electron/themeBuilder.js` | Ayarlardan `color.ini`, `user.css`, `theme.js` ve `assets/` üretir |
| `shared/theme.js` | Hazır temalar, renk türetme, ayar doğrulama (arayüz ve ana süreç ortak) |
| `src/` | React arayüzü |

Üretilen tema `%APPDATA%\spicetify\Themes\SpotifyStudio` klasörüne yazılır. `theme.js` Spotify'ın içinde çalışır; arka planı ekler, saate ya da albüm kapağına göre renkleri değiştirir.

Ayarlar `%APPDATA%\Spotify Studio\` altında saklanır.

## Bilinmesi gerekenler

- Spicetify, Spotify'ın resmi bir aracı değildir ve kullanım şartlarına aykırı sayılır.
- Spotify 1.3.x'te sınıf adları rastgele üretiliyor. Tema bu yüzden `#main-view`, `data-testid`, `data-encore-id` gibi sabit adlara ve Spotify'ın `--background-base` değişkenine dayanıyor. Spotify bunları değiştirirse bazı ayrıntılar bozulabilir.
- Gizleme seçeneklerinin bir kısmı butonların Türkçe/İngilizce adlarına göre çalışıyor; Spotify başka bir dildeyse bunlar etkisiz kalır.
- Pencere düğmelerinin (küçült/kapat) arkasındaki alan Spotify'ın kendi çerçevesi; tema onu boyayamaz.
- Albüm kapağı modu Spotify'ın renk servisini kullanıyor; olmazsa kapak uygulama içinde analiz ediliyor.
- Uygulama yönetici olarak çalıştırılmamalı; Spicetify yönetici yetkisiyle çalışmayı reddeder.
- Uygulamayı dağıtacaksan adında "Spotify" geçmesi marka sorunu çıkarabilir.

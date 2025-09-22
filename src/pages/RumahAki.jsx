import React from 'react';
import { 
  Battery, 
  Zap, 
  Wrench, 
  RefreshCw, 
  Truck, 
  Phone, 
  MapPin, 
  AlertTriangle,
  Lightbulb,
  Calendar,
  Snowflake,
  CheckCircle,
  ArrowRight,
  Star
} from 'lucide-react';

const RumahAki = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-20">
        <div className="w-full h-full" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%239C92AC' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          backgroundRepeat: 'repeat'
        }}></div>
      </div>
      
      {/* Main Container - 2/3 layar */}
      <div className="relative z-10 min-h-screen flex items-center justify-center">
        <div className="w-full max-w-7xl mx-auto px-6 py-12">
          
          {/* Header */}
          <header className="text-center mb-16">
            <h1 className="text-6xl md:text-8xl lg:text-9xl font-black tracking-tight mb-8">
              <span className="bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 bg-clip-text text-transparent drop-shadow-2xl">
                Rumah Aki
              </span>
              <br />
              <span className="text-white drop-shadow-2xl">Jayapura</span>
            </h1>
            <p className="text-2xl md:text-3xl lg:text-4xl text-white/90 font-medium max-w-5xl mx-auto leading-relaxed mb-8">
              Solusi terdepan untuk semua masalah aki kendaraan di Jayapura! 
            </p>
            <div className="flex flex-wrap justify-center gap-6 text-xl md:text-2xl">
              <span className="bg-gradient-to-r from-yellow-400 to-orange-500 text-black px-8 py-4 rounded-full font-bold shadow-2xl hover:scale-105 transition-transform">
                ⚡ Cepat
              </span>
              <span className="bg-gradient-to-r from-blue-400 to-purple-500 text-white px-8 py-4 rounded-full font-bold shadow-2xl hover:scale-105 transition-transform">
                🔧 Profesional
              </span>
              <span className="bg-gradient-to-r from-green-400 to-teal-500 text-white px-8 py-4 rounded-full font-bold shadow-2xl hover:scale-105 transition-transform">
                💯 Terpercaya
              </span>
            </div>
          </header>

          {/* Warning Signs Section */}
          <section className="mb-20">
            <div className="text-center mb-16">
              <h2 className="text-5xl md:text-6xl lg:text-7xl font-bold text-white mb-6 drop-shadow-2xl">
                ⚠️ Awas, Aki Bisa Drop!
              </h2>
              <p className="text-2xl md:text-3xl text-white/80 max-w-4xl mx-auto leading-relaxed">
                Kenali tanda-tanda aki lemah sebelum kendaraan mogok di jalan
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {[
                {
                  icon: <AlertTriangle className="w-16 h-16 text-orange-400" />,
                  title: "Starter Berat",
                  description: "Mesin bunyi 'ngok.. ngok..' lama baru mau menyala? Itu tanda aki sudah mulai lemah dan perlu perhatian segera.",
                  color: "from-orange-500/20 to-orange-600/20 border-orange-400/30"
                },
                {
                  icon: <Lightbulb className="w-16 h-16 text-yellow-400" />,
                  title: "Lampu Redup",
                  description: "Lampu motor/mobil tidak terang seperti biasa, klakson juga bunyinya melempem dan tidak nyaring.",
                  color: "from-yellow-500/20 to-yellow-600/20 border-yellow-400/30"
                },
                {
                  icon: <Calendar className="w-16 h-16 text-blue-400" />,
                  title: "Aki Sudah Tua",
                  description: "Umur aki normal 2-3 tahun saja. Kalau sudah lebih, waktunya cek rutin atau ganti, bro!",
                  color: "from-blue-500/20 to-blue-600/20 border-blue-400/30"
                },
                {
                  icon: <Snowflake className="w-16 h-16 text-cyan-400" />,
                  title: "Ada Jamur Putih",
                  description: "Ada bubuk putih di kepala aki? Itu jamur yang bikin listrik tidak jalan dengan baik.",
                  color: "from-cyan-500/20 to-cyan-600/20 border-cyan-400/30"
                }
              ].map((item, index) => (
                <div
                  key={index}
                  className={`bg-gradient-to-br ${item.color} border-2 backdrop-blur-sm rounded-3xl p-8 text-center hover:shadow-2xl transition-all duration-300 hover:-translate-y-3 hover:scale-105`}
                >
                  <div className="flex justify-center mb-8">
                    {item.icon}
                  </div>
                  <h3 className="text-3xl font-bold text-white mb-6">{item.title}</h3>
                  <p className="text-white/80 leading-relaxed text-lg">{item.description}</p>
                </div>
              ))}
            </div>
            
            <div className="text-center mt-16 p-12 bg-gradient-to-r from-red-500 via-orange-500 to-yellow-500 rounded-3xl text-white shadow-2xl">
              <p className="text-3xl md:text-4xl font-bold mb-4">
                Merasakan tanda-tanda ini? Jangan tunggu mogok!
              </p>
              <p className="text-2xl md:text-3xl">
                Ayoo, <span className="font-black text-yellow-200">cek aki GRATIS</span> di Rumah Aki!
              </p>
            </div>
          </section>

          {/* Services Section */}
          <section className="mb-20">
            <div className="text-center mb-16">
              <h2 className="text-5xl md:text-6xl lg:text-7xl font-bold text-white mb-6 drop-shadow-2xl">
                🛠️ Layanan Lengkap di Rumah Aki
              </h2>
              <p className="text-2xl md:text-3xl text-white/80 max-w-4xl mx-auto leading-relaxed">
                Semua kebutuhan aki dan servis kendaraan ada di sini
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[
                {
                  icon: <Battery className="w-12 h-12 text-green-400" />,
                  title: "Ganti Aki Mobil & Motor",
                  description: "Semua merk dan tipe aki tersedia. Dari yang standar sampai premium. Kami pasang langsung di tempat dengan garansi resmi.",
                  color: "hover:shadow-green-500/50"
                },
                {
                  icon: <Zap className="w-12 h-12 text-yellow-400" />,
                  title: "Stroom / Cas Aki",
                  description: "Aki mulai tekor? Bawa ke sini kami stroom sampai full lagi. Cepat, aman, dan menggunakan alat terbaik.",
                  color: "hover:shadow-yellow-500/50"
                },
                {
                  icon: <Wrench className="w-12 h-12 text-blue-400" />,
                  title: "Ganti Oli Motor",
                  description: "Biar mesin motor halus dan awet, jangan lupa ganti oli rutin di tempat kami dengan oli berkualitas.",
                  color: "hover:shadow-blue-500/50"
                },
                {
                  icon: <RefreshCw className="w-12 h-12 text-purple-400" />,
                  title: "Jual Beli Aki Bekas",
                  description: "Punya aki bekas? Jangan buang! Bawa ke Rumah Aki, kami beli dengan harga yang menguntungkan.",
                  color: "hover:shadow-purple-500/50"
                },
                {
                  icon: <Truck className="w-12 h-12 text-red-400" />,
                  title: "Layanan Antar & Pasang",
                  description: "Sibuk atau mogok di jalan? Telepon saja, tim kami langsung meluncur ke lokasi Anda. Beres dalam hitungan menit!",
                  color: "hover:shadow-red-500/50 bg-gradient-to-br from-slate-800/80 to-slate-900/80 text-white backdrop-blur-sm"
                }
              ].map((service, index) => (
                <div
                  key={index}
                  className={`bg-white/10 backdrop-blur-sm rounded-3xl p-10 shadow-2xl hover:shadow-3xl transition-all duration-300 hover:-translate-y-4 hover:scale-105 ${service.color} ${index === 4 ? 'md:col-span-2 lg:col-span-2' : ''}`}
                >
                  <div className="flex items-center mb-8">
                    <div className="p-4 bg-white/20 rounded-2xl mr-6">
                      {service.icon}
                    </div>
                    <h3 className="text-3xl font-bold text-white">{service.title}</h3>
                  </div>
                  <p className={`leading-relaxed text-lg ${index === 4 ? 'text-white/80' : 'text-white/90'}`}>
                    {service.description}
                  </p>
                </div>
              ))}
            </div>
          </section>

          {/* Promo Section */}
          <section className="mb-20">
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-purple-600 via-pink-600 to-red-600 p-2 shadow-2xl">
              <div className="bg-white rounded-3xl p-16 text-center">
                <h2 className="text-5xl md:text-6xl font-black text-slate-800 mb-6">
                  🔥 PROMO BULAN INI!
                </h2>
                <p className="text-3xl md:text-4xl font-bold text-slate-700 mb-8">
                  Ganti Oli Motor di Rumah Aki...
                </p>
                <div className="inline-block bg-gradient-to-r from-purple-600 to-pink-600 text-white px-12 py-6 rounded-3xl text-4xl md:text-5xl font-black mb-8 shadow-2xl">
                  GRATIS STROOM AKI SAMPE FULL!
                </div>
                <p className="text-2xl md:text-3xl text-slate-600 mb-12">
                  Kapan lagi servis dobel begini? Ayoo, mampir ke bengkel kami. Jangan sampai kehabisan!
                </p>
                <button className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-12 py-6 rounded-3xl text-2xl font-bold hover:shadow-2xl transition-all duration-300 hover:scale-110 flex items-center mx-auto">
                  Dapatkan Promo Sekarang
                  <ArrowRight className="ml-4 w-8 h-8" />
                </button>
              </div>
            </div>
          </section>

          {/* Emergency Service Section */}
          <section className="mb-20">
            <div className="text-center mb-16">
              <h2 className="text-5xl md:text-6xl lg:text-7xl font-bold text-white mb-6 drop-shadow-2xl">
                🚨 Mobil Mogok? Tenang, Bro!
              </h2>
              <p className="text-2xl md:text-3xl text-white/80 max-w-5xl mx-auto leading-relaxed">
                Aki drop pas lagi sibuk-sibuk? Tidak usah pusing panggil derek! 
                Simpan nomor kami, ini prosesnya yang super mudah:
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
              {[
                {
                  step: "1",
                  icon: <Phone className="w-20 h-20 text-green-400" />,
                  title: "Telepon Kami",
                  description: "Kasih tau lokasi dan masalah yang dialami. Tim kami siap 24/7!",
                  color: "from-green-500/20 to-green-600/20 border-green-400/30"
                },
                {
                  step: "2", 
                  icon: <Truck className="w-20 h-20 text-blue-400" />,
                  title: "Kami Meluncur",
                  description: "Tim profesional langsung tancap gas ke lokasi Anda dalam hitungan menit.",
                  color: "from-blue-500/20 to-blue-600/20 border-blue-400/30"
                },
                {
                  step: "3",
                  icon: <CheckCircle className="w-20 h-20 text-purple-400" />,
                  title: "Beres di Tempat",
                  description: "Ganti aki baru, starter, dan Anda bisa langsung melanjutkan perjalanan!",
                  color: "from-purple-500/20 to-purple-600/20 border-purple-400/30"
                }
              ].map((step, index) => (
                <div
                  key={index}
                  className={`bg-gradient-to-br ${step.color} border-2 backdrop-blur-sm rounded-3xl p-10 text-center relative hover:scale-105 transition-all duration-300`}
                >
                  {index < 2 && (
                    <div className="hidden md:block absolute -right-6 top-1/2 transform -translate-y-1/2">
                      <ArrowRight className="w-12 h-12 text-white/60" />
                    </div>
                  )}
                  <div className="flex justify-center mb-8">
                    {step.icon}
                  </div>
                  <div className="bg-white/20 backdrop-blur-sm rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-6">
                    <span className="text-3xl font-bold text-white">{step.step}</span>
                  </div>
                  <h3 className="text-3xl font-bold text-white mb-6">{step.title}</h3>
                  <p className="text-white/80 leading-relaxed text-lg">{step.description}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Footer */}
          <footer className="text-center py-20 bg-gradient-to-r from-slate-800/80 to-slate-900/80 backdrop-blur-sm rounded-3xl text-white shadow-2xl">
            <h3 className="text-5xl md:text-6xl font-black mb-8 bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">
              Tunggu Apa Lagi?
            </h3>
            <p className="text-2xl md:text-3xl text-white/80 mb-12 max-w-4xl mx-auto leading-relaxed">
              Kalau ada masalah aki, jangan ragu-ragu. Langsung saja datang atau telepon Rumah Aki. 
              Kami siap melayani 24/7!
            </p>
            
            <div className="bg-white/10 backdrop-blur-sm rounded-3xl p-12 max-w-4xl mx-auto shadow-2xl">
              <div className="flex flex-col md:flex-row items-center justify-center gap-8 mb-8">
                <div className="flex items-center">
                  <MapPin className="w-8 h-8 text-yellow-400 mr-4" />
                  <p className="text-2xl font-bold">
                    <span className="text-yellow-400">📍 Alamat:</span> 
                    <span className="ml-3 text-white">Jl. Raya Jayapura No. 123, Jayapura</span>
                  </p>
                </div>
                <div className="flex items-center">
                  <Phone className="w-8 h-8 text-green-400 mr-4" />
                  <p className="text-2xl font-bold">
                    <span className="text-green-400">📞 WhatsApp:</span> 
                    <span className="ml-3 text-white">+62 812-3456-7890</span>
                  </p>
                </div>
              </div>
            </div>
            
            <div className="mt-12 flex justify-center space-x-4">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-8 h-8 text-yellow-400 fill-current" />
              ))}
            </div>
            <p className="text-white/60 mt-6 text-xl">⭐ 4.9/5 dari 500+ pelanggan puas</p>
          </footer>

        </div>
      </div>
    </div>
  );
};

export default RumahAki;

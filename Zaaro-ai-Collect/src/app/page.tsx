import Link from "next/link";
import Image from "next/image";
import { Mic, UserPlus, ShieldCheck, ArrowRight, CheckCircle2, Globe, Heart } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col font-sans bg-white text-slate-900 selection:bg-brand-green/20 selection:text-brand-green overflow-x-hidden">
      
      {/* Navbar */}
      <header className="w-full bg-white relative z-50 border-b border-brand-green/10">
        <div className="container mx-auto px-4 md:px-8 h-20 flex items-center justify-between max-w-7xl">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-md bg-brand-green flex items-center justify-center">
              <Mic className="w-4 h-4 text-white" />
            </div>
            <span className="text-2xl font-extrabold text-brand-green-dark tracking-tight">Zaaro AI</span>
          </div>
          
          <nav className="hidden md:flex items-center gap-8">
            <a href="#mission" className="text-base font-bold text-slate-700 hover:text-brand-green transition-colors">Notre Mission</a>
            <a href="#plateforme" className="text-base font-bold text-slate-700 hover:text-brand-green transition-colors">Plateforme</a>
            <a href="#impact" className="text-base font-bold text-slate-700 hover:text-brand-green transition-colors">Impact</a>
          </nav>

          <div className="flex items-center gap-6">
            <Link href="/login" className="text-base font-bold text-slate-700 hover:text-brand-green transition-colors hidden sm:block">
              Se connecter
            </Link>
            <Link href="/register" className="text-base font-bold bg-brand-green hover:bg-brand-green-dark text-white px-6 py-2.5 rounded-sm transition-colors shadow-sm">
              Commencer
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative pt-16 pb-32 lg:pt-24 lg:pb-48 bg-brand-green-light/40">
          <div className="container mx-auto px-4 md:px-8 max-w-7xl">
            <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-16">
              
              <div className="flex-1 text-center lg:text-left z-10">
                <div className="inline-flex items-center gap-2 bg-brand-yellow/30 text-brand-green-dark px-4 py-1.5 rounded-full text-sm font-bold mb-6">
                  <span className="w-2 h-2 rounded-full bg-brand-red" />
                  Collecte vocale · Burkina Faso
                </div>
                <h1 className="text-5xl lg:text-[4.5rem] font-extrabold tracking-tight text-brand-green-dark leading-[1.1] mb-6">
                  Donnez une voix à l'IA pour mieux grandir.
                </h1>
                <p className="text-lg lg:text-xl text-slate-600 mb-8 max-w-xl mx-auto lg:mx-0 font-medium">
                  Enregistrez votre voix pour construire les modèles linguistiques de demain au Burkina Faso. Simple, éthique et ouvert.
                </p>
                <div className="flex flex-col sm:flex-row items-center gap-4 justify-center lg:justify-start">
                  <Link href="/register" className="w-full sm:w-auto bg-brand-green hover:bg-brand-green-dark text-white px-8 py-4 rounded-sm font-bold text-lg transition-colors shadow-sm text-center">
                    Devenir contributeur
                  </Link>
                  <a href="#plateforme" className="text-base font-bold text-brand-red hover:underline flex items-center justify-center gap-2 py-4 px-2">
                    Découvrir le projet
                  </a>
                </div>
              </div>
              
              <div className="flex-1 w-full max-w-lg lg:max-w-none relative z-10">
                <div className="absolute -bottom-8 -left-8 w-64 h-64 bg-brand-yellow rounded-full mix-blend-multiply opacity-60" style={{ borderRadius: '40% 60% 70% 30% / 40% 50% 60% 50%' }}></div>
                <div className="absolute top-10 -right-4 w-72 h-72 bg-brand-red/20 rounded-full mix-blend-multiply opacity-70" style={{ borderRadius: '60% 40% 30% 70% / 60% 30% 70% 40%' }}></div>
                
                <div className="relative aspect-[4/3] w-full rounded-tr-[5rem] rounded-bl-[5rem] overflow-hidden shadow-2xl border-4 border-white bg-white z-10">
                  <Image 
                    src="/hero-illustration.png" 
                    alt="Illustration représentant la collecte audio" 
                    fill 
                    className="object-cover"
                    priority
                  />
                </div>
              </div>
            </div>
          </div>
          
          <div className="absolute bottom-0 left-0 right-0 w-full overflow-hidden leading-none">
            <svg className="relative block w-full h-[60px] md:h-[120px]" data-name="Layer 1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 120" preserveAspectRatio="none">
              <path d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V120H0V95.8C59.71,118.08,130.83,123.3,196.47,112.5,239.12,105.47,280.9,86.81,321.39,56.44Z" fill="#ffffff"></path>
            </svg>
          </div>
        </section>

        {/* Notre Mission — texte seul, sans vidéo */}
        <section id="mission" className="py-24 bg-white relative">
          <div className="container mx-auto px-4 md:px-8 max-w-4xl text-center">
            <h2 className="text-3xl lg:text-4xl font-extrabold text-brand-green-dark mb-6">Notre Mission</h2>
            <p className="text-lg text-slate-600 mb-6 leading-relaxed">
              L'intelligence artificielle transforme le monde, mais de nombreuses langues africaines en sont exclues. Notre mission est de collecter des données vocales de haute qualité pour inclure les langues du Burkina Faso dans la révolution technologique.
            </p>
            <p className="text-lg text-slate-600 leading-relaxed mb-12">
              Chaque voix compte. En participant, vous aidez directement les chercheurs et développeurs locaux à construire des outils adaptés à notre réalité (santé, administration, agriculture).
            </p>

            <div className="grid md:grid-cols-3 gap-6 mb-12 text-left">
              {[
                { icon: Globe, color: "bg-brand-green/10 text-brand-green", title: "Langues locales", desc: "Mooré, Dioula, Gourounsi, Fulfulde et plus encore." },
                { icon: Heart, color: "bg-brand-red/10 text-brand-red", title: "Impact communautaire", desc: "Des outils IA pensés pour la réalité burkinabè." },
                { icon: ShieldCheck, color: "bg-brand-yellow/30 text-brand-yellow-dark", title: "Qualité garantie", desc: "Chaque enregistrement est validé par un administrateur." },
              ].map(({ icon: Icon, color, title, desc }) => (
                <div key={title} className="p-6 rounded-lg border border-slate-100 shadow-sm">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-4 ${color}`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <h3 className="font-bold text-brand-green-dark mb-2">{title}</h3>
                  <p className="text-sm text-slate-600 leading-relaxed">{desc}</p>
                </div>
              ))}
            </div>

            <Link href="/register" className="inline-block bg-brand-green hover:bg-brand-green-dark text-white px-8 py-3.5 rounded-sm font-bold transition-colors shadow-sm">
              Rejoindre la mission
            </Link>
          </div>
        </section>

        {/* Platform Grid Section */}
        <section id="plateforme" className="py-24 bg-brand-green-light/30 relative">
          <div className="container mx-auto px-4 md:px-8 max-w-6xl">
            <div className="mb-16">
              <h2 className="text-3xl lg:text-4xl font-extrabold text-brand-green-dark mb-4 text-center lg:text-left">La Plateforme de Collecte</h2>
              <p className="text-lg text-slate-600 max-w-2xl text-center lg:text-left">
                Un espace sécurisé et intuitif conçu pour faciliter l'enregistrement de données linguistiques fiables, pour les contributeurs comme pour les chercheurs.
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[
                {
                  icon: UserPlus,
                  title: "1. Profil Contributeur",
                  desc: "Un espace personnel simple pour déclarer vos langues maternelles et votre région d'origine. Vos données restent confidentielles.",
                  color: "text-brand-green"
                },
                {
                  icon: Mic,
                  title: "2. Studio d'Enregistrement",
                  desc: "Une interface claire pour lire des phrases issues de divers domaines (Santé, Agriculture) et enregistrer votre voix en haute qualité.",
                  color: "text-brand-red"
                },
                {
                  icon: ShieldCheck,
                  title: "3. Validation Qualité",
                  desc: "Chaque enregistrement est écouté et validé par un administrateur pour garantir la justesse de l'audio par rapport au texte.",
                  color: "text-brand-yellow-dark"
                }
              ].map((step, idx) => (
                <div key={idx} className="bg-white rounded-lg p-10 shadow-[0_4px_20px_rgb(0,0,0,0.04)] border border-slate-100 hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-all flex flex-col items-start text-left h-full">
                  <step.icon className={`w-8 h-8 mb-6 ${step.color}`} />
                  <h3 className="text-xl font-bold mb-3 text-brand-green-dark">{step.title}</h3>
                  <p className="text-base text-slate-600 leading-relaxed font-medium mb-6 flex-1">
                    {step.desc}
                  </p>
                  <Link href="/register" className="text-sm font-bold text-brand-green hover:underline mt-auto flex items-center gap-1">
                    Voir en détail <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </section>
        
        {/* Impact Section */}
        <section id="impact" className="relative bg-brand-green-dark pt-32 pb-24 text-white overflow-hidden">
          <div className="absolute top-0 left-0 right-0 w-full overflow-hidden leading-none rotate-180">
            <svg className="relative block w-full h-[60px] md:h-[100px]" data-name="Layer 1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 120" preserveAspectRatio="none">
              <path d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V120H0V95.8C59.71,118.08,130.83,123.3,196.47,112.5,239.12,105.47,280.9,86.81,321.39,56.44Z" fill="#f0fdf4"></path>
            </svg>
          </div>

          <div className="container mx-auto px-4 md:px-8 max-w-6xl relative z-10">
            <div className="text-center mb-16">
              <h2 className="text-3xl lg:text-4xl font-extrabold mb-4">Notre Impact</h2>
              <p className="text-lg text-green-100 max-w-2xl mx-auto">Ensemble, nous construisons le socle technologique pour préserver et valoriser les langues du Burkina Faso.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 border-t border-l border-green-800/50">
              <div className="p-12 text-center border-b border-r border-green-800/50">
                <div className="w-12 h-12 mx-auto bg-brand-yellow/20 rounded-full flex items-center justify-center mb-6">
                  <Mic className="w-5 h-5 text-brand-yellow" />
                </div>
                <div className="text-5xl font-black mb-2">400<span className="text-brand-yellow">+</span></div>
                <div className="text-sm font-bold uppercase tracking-widest text-green-300">Heures visées</div>
              </div>
              <div className="p-12 text-center border-b border-r border-green-800/50">
                <div className="w-12 h-12 mx-auto bg-brand-red/20 rounded-full flex items-center justify-center mb-6">
                  <UserPlus className="w-5 h-5 text-brand-red" />
                </div>
                <div className="text-5xl font-black mb-2">100<span className="text-brand-red">%</span></div>
                <div className="text-sm font-bold uppercase tracking-widest text-green-300">Communautaire</div>
              </div>
              <div className="p-12 text-center border-b border-r border-green-800/50">
                <div className="w-12 h-12 mx-auto bg-brand-green/30 rounded-full flex items-center justify-center mb-6">
                  <CheckCircle2 className="w-5 h-5 text-green-300" />
                </div>
                <div className="text-5xl font-black mb-2">100<span className="text-brand-yellow">%</span></div>
                <div className="text-sm font-bold uppercase tracking-widest text-green-300">Qualité validée</div>
              </div>
            </div>
            
            <div className="mt-16 text-center">
              <Link href="/register" className="inline-block bg-brand-yellow hover:bg-brand-yellow-dark text-brand-green-dark px-8 py-3.5 rounded-sm font-bold transition-colors shadow-lg">
                Contribuer maintenant
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-brand-green-dark border-t border-green-800 pt-16 pb-8 text-green-200">
        <div className="container mx-auto px-4 md:px-8 max-w-6xl">
          <div className="flex flex-col md:flex-row justify-between items-start gap-12 mb-12">
            <div className="max-w-xs">
              <div className="flex items-center gap-2.5 mb-6">
                <div className="w-8 h-8 rounded-md bg-brand-yellow flex items-center justify-center">
                  <Mic className="w-4 h-4 text-brand-green-dark" />
                </div>
                <span className="text-2xl font-extrabold text-white tracking-tight">Zaaro AI</span>
              </div>
              <p className="text-sm leading-relaxed text-green-300">
                Plateforme ouverte de collecte de données vocales pour l'entraînement de modèles d'Intelligence Artificielle en Afrique.
              </p>
            </div>
            
            <div className="flex gap-16">
              <div>
                <h4 className="font-bold text-white mb-4">Plateforme</h4>
                <ul className="space-y-3 text-sm">
                  <li><Link href="/login" className="hover:text-brand-yellow transition-colors">Se connecter</Link></li>
                  <li><Link href="/register" className="hover:text-brand-yellow transition-colors">S'inscrire</Link></li>
                  <li><Link href="/admin" className="hover:text-brand-yellow transition-colors">Administration</Link></li>
                </ul>
              </div>
              <div>
                <h4 className="font-bold text-white mb-4">Projet</h4>
                <ul className="space-y-3 text-sm">
                  <li><a href="#mission" className="hover:text-brand-yellow transition-colors">Notre Mission</a></li>
                  <li><a href="#impact" className="hover:text-brand-yellow transition-colors">L'Impact</a></li>
                </ul>
              </div>
            </div>
          </div>
          
          <div className="flex flex-col md:flex-row items-center justify-between pt-8 border-t border-green-800 text-sm text-green-400">
            <p>© {new Date().getFullYear()} Infinity Lab. Tous droits réservés.</p>
            <div className="flex gap-4 mt-4 md:mt-0">
              <span>Propulsé par Infinity Lab</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

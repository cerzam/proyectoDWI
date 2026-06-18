import Navbar from './components/Navbar'
import Hero from './components/Hero'
import Problem from './components/Problem'
import Solution from './components/Solution'
import Benefits from './components/Benefits'
import Pricing from './components/Pricing'
import FAQ from './components/FAQ'
import CTAForm from './components/CTAForm'
import Footer from './components/Footer'

export default function App() {
  return (
    <div className="min-h-screen font-sans">
      <Navbar />
      <main>
        <Hero />
        <Problem />
        <Solution />
        <Benefits />
        <Pricing />
        <FAQ />
        <CTAForm />
      </main>
      <Footer />
    </div>
  )
}
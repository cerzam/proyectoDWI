import Navbar from './components/Navbar'
import Hero from './components/Hero'
import Problem from './components/Problem'
import Solution from './components/Solution'
import Benefits from './components/Benefits'
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
        <CTAForm />
      </main>
      <Footer />
    </div>
  )
}

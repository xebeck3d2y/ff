import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Shield, Lock, Share, FileCheck, Users, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";

const Landing = () => {
  const navigate = useNavigate();

  const fadeIn = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6 }
  };

  const stats = [
    { number: "99.9%", label: "Uptime" },
    { number: "10M+", label: "Files Shared" },
    { number: "50k+", label: "Users" },
    { number: "128-bit", label: "Encryption" }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-100">
      {/* Header */}
      <motion.header 
        className="container mx-auto px-4 py-4"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex justify-between items-center">
          <div className="text-xl font-bold text-blue-600">FileGuardX</div>
          <div>
            <Button 
              variant="ghost" 
              className="mr-2"
              onClick={() => navigate("/login")}
            >
              Log In
            </Button>
            <Button 
              onClick={() => navigate("/register")}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Sign Up
            </Button>
          </div>
        </div>
      </motion.header>

      {/* Hero Section */}
      <motion.div 
        className="container mx-auto px-4 py-12 md:py-24 flex flex-col items-center text-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
      >
        <motion.h1 
          className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-6 bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-cyan-500"
          {...fadeIn}
        >
          Secure File Exchange Platform
        </motion.h1>
        <motion.p 
          className="text-lg md:text-xl text-gray-700 max-w-3xl mb-8"
          {...fadeIn}
          transition={{ delay: 0.2 }}
        >
          Easily upload, manage and share files with bank-level security. 
          Keep your sensitive documents protected while collaborating seamlessly.
        </motion.p>
        <motion.div 
          className="flex flex-col sm:flex-row gap-4"
          {...fadeIn}
          transition={{ delay: 0.4 }}
        >
          <Button 
            size="lg" 
            className="text-md px-8 bg-blue-600 hover:bg-blue-700"
            onClick={() => navigate("/register")}
          >
            Get Started <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
          <Button 
            variant="outline" 
            size="lg"
            className="text-md px-8"
            onClick={() => navigate("/login")}
          >
            Log In
          </Button>
        </motion.div>
      </motion.div>

      {/* Stats Section */}
      <motion.div 
        className="container mx-auto px-4 py-16"
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        viewport={{ once: true }}
      >
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((stat, index) => (
            <motion.div 
              key={index}
              className="text-center"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              viewport={{ once: true }}
            >
              <div className="text-3xl font-bold text-blue-600">{stat.number}</div>
              <div className="text-gray-600">{stat.label}</div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Features Section */}
      <motion.div 
        className="container mx-auto px-4 py-16"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
        viewport={{ once: true }}
      >
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">Key Features</h2>
          <p className="text-gray-700 max-w-2xl mx-auto">
            Our platform provides everything you need for secure file management
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {[
            { icon: Shield, title: "End-to-End Encryption", description: "Your files are encrypted from the moment they leave your device" },
            { icon: Lock, title: "Access Controls", description: "Granular permissions to control who can view, edit or share files" },
            { icon: Share, title: "Easy Sharing", description: "Share files securely with team members or external partners" },
            { icon: FileCheck, title: "Version Control", description: "Track changes and maintain complete version history" }
          ].map((feature, index) => (
            <motion.div 
              key={index}
              className="bg-white p-6 rounded-xl shadow-sm border hover:shadow-md transition-shadow"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              viewport={{ once: true }}
            >
              <div className="h-12 w-12 rounded-lg bg-blue-100 flex items-center justify-center mb-4">
                <feature.icon className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
              <p className="text-gray-600">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* CTA Section */}
      <motion.div 
        className="bg-gradient-to-r from-blue-600 to-blue-700 text-white py-16"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
        viewport={{ once: true }}
      >
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to secure your files?</h2>
          <p className="max-w-2xl mx-auto mb-8 text-blue-100">
            Join thousands of companies that trust our platform for their secure file sharing needs
          </p>
          <Button 
            variant="secondary" 
            size="lg"
            className="text-blue-600 hover:text-blue-700 bg-white hover:bg-gray-100"
            onClick={() => navigate("/register")}
          >
            Create Your Free Account <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </div>
      </motion.div>

      {/* Footer */}
      <footer className="bg-gray-50 py-8 border-t">
        <div className="container mx-auto px-4 text-center">
          <p className="text-gray-600">
            © {new Date().getFullYear()} FileGuardX - Secure File Exchange Platform
          </p>
          <div className="flex justify-center mt-4 gap-4">
            <a href="#" className="text-gray-500 hover:text-gray-700 transition-colors">Terms</a>
            <a href="#" className="text-gray-500 hover:text-gray-700 transition-colors">Privacy</a>
            <a href="#" className="text-gray-500 hover:text-gray-700 transition-colors">Security</a>
            <a href="#" className="text-gray-500 hover:text-gray-700 transition-colors">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;

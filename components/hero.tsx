import Image from "next/image";

export default function Header() {
  return (
    <div className="flex flex-col gap-8 items-center py-12 text-center">
      <div className="flex flex-col items-center">
        <Image 
          src="/images/logo.png" 
          alt="Ward Cleaning App Logo" 
          width={180} 
          height={180} 
          className="mb-6"
        />
        <h1 className="text-4xl md:text-5xl font-bold mb-4">Ward Cleaning App</h1>
        <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto">
          Simplifying ward building cleaning management for the church
        </p>
      </div>
      <div className="flex gap-4 mt-8">
        <a 
          href="#features" 
          className="px-6 py-3 bg-primary text-primary-foreground rounded-md font-medium hover:opacity-90 transition-opacity"
        >
          Learn More
        </a>
        <a 
          href="/coming-soon" 
          className="px-6 py-3 bg-secondary text-secondary-foreground rounded-md font-medium hover:bg-secondary/80 transition-colors"
        >
          Get Started
        </a>
      </div>
      <div className="w-full p-[1px] bg-gradient-to-r from-transparent via-foreground/10 to-transparent my-6" />
    </div>
  );
}

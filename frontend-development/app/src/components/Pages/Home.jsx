import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import '../../components/Styles/Home.css';

const Home = () => {
  const navigate = useNavigate();
  const pathRef = useRef(null);

  useEffect(() => {
    const animatedLine = pathRef.current;

    // Get the total length of the path
    const totalLength = animatedLine.getTotalLength();

    // Set the animation duration based on the arrow animation duration
    const animationDuration = 3000; // Change this value to match the arrow animation duration in milliseconds

    // Set up the animation for the arrow
    animatedLine.style.transition = animatedLine.style.WebkitTransition = 'none';
    animatedLine.style.strokeDasharray = totalLength;
    animatedLine.style.strokeDashoffset = totalLength;

    // Trigger the arrow animation
    setTimeout(() => {
      animatedLine.style.transition = animatedLine.style.WebkitTransition = `stroke-dashoffset ${animationDuration}ms ease-in-out`;
      animatedLine.style.strokeDashoffset = '0';
    }, 100);

    // Redirect to the Welcome page after the arrow animation has finished
    setTimeout(() => {
      navigate('/welcome');
    }, animationDuration + 200); // Add a small delay (200ms) to ensure the animation finishes before redirecting
  }, [navigate]);

  return (
    <div className="container">
      <div className="content">
        <h1 className="title">
          <span className="green">Green</span>
          <span className="ify">iFy</span>
        </h1>
        <svg className="animated-green-line" viewBox="0 0 424 328">
          <defs>
            <mask id="line-mask">
              <rect x="0" y="0" width="100%" height="100%" fill="white" />
              <rect x="0" y="0" width="100%" height="100%" fill="black" className="mask-rect" />
            </mask>
          </defs>
          <path
            ref={pathRef} // Add a ref to the path element
            d="M0,328 L50,200 L100,250 L150,100 L200,200 L250,80 L300,180 L350,100 L400,50"
            stroke="#1cff32"
            strokeWidth="14"
            fill="none"
            mask="url(#line-mask)"
          />
          <polygon points="400,50 390,30 410,30" fill="#1cff32" className="arrow" />
        </svg>
      </div>
    </div>
  );
};

export default Home;
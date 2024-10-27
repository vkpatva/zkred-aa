/* eslint-disable @next/next/no-img-element */
"use client";

import { useState, useEffect } from "react";

export default function Aadhar() {
  const [currentStep, setCurrentStep] = useState(1);
  const [, setIsLoading] = useState(false);
  const [, setError] = useState<string | null>(null);
  const [link, setLink] = useState("");
  const [digilockerId, setDigilockerId] = useState("");
  const [deepLink, setDeepLink] = useState("");
  const [universalLink, setUniversalLink] = useState("");
  const steps = [
    {
      title: "Connect to DigiLocker",
      description: "Securely connect to your DigiLocker account",
      icon: "🔗",
    },
    {
      title: "Share Aadhar",
      description: "Share your Aadhar card from DigiLocker",
      icon: "📄",
    },
    {
      title: "Generate Credentials",
      description: "Create verifiable credentials from your Aadhar",
      icon: "🔐",
    },
    {
      title: "Receive Credentials",
      description: "Get your credentials via QR code or wallet",
      icon: "📱",
    },
  ];

  useEffect(() => {
    // Get URL parameters
    const searchParams = new URLSearchParams(window.location.search);
    const success = searchParams.get("success");
    const id = searchParams.get("id");
    setDigilockerId(id as string);
    // If success is true and id exists, update step and log id
    if (success === "True" && id) {
      console.log("DigiLocker ID:", id);
      setCurrentStep(3);
    }
  }, []); // Empty dependency array means this runs once on component mount

  const handleDigilockerConnect = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/digilocker/connect", {
        method: "POST",
      });

      const data = await response.json();

      if (data.url) {
        setLink(data.url);
        setCurrentStep(2);
      } else {
        throw new Error("No redirect URL received");
      }
    } catch (error) {
      setError("Failed to connect to DigiLocker. Please try again.");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };
  const handleIssueCredentials = async () => {
    console.log("Issuing credentials");
    setIsLoading(true);
    setError(null);

    try {
      // Call your API endpoint with the digilockerId
      const response = await fetch(
        `/api/digilocker/issue-credential?id=${digilockerId}`,
        {
          method: "GET",
        }
      );

      const data = await response.json();

      setDeepLink(data.deepLink);
      setUniversalLink(data.universalLink);
      setCurrentStep(4);
    } catch (error) {
      console.error("Error issuing credentials:", error);
      setError("Failed to issue credentials. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-center text-gray-900 mb-12">
          Aadhar Verification
        </h1>

        <div className="mb-12">
          <div className="flex justify-between items-center">
            {steps.map((step, index) => (
              <div key={index} className="flex flex-col items-center w-1/4">
                <div
                  className={`
                  w-12 h-12 rounded-full flex items-center justify-center text-xl
                  ${
                    currentStep > index + 1
                      ? "bg-green-500 text-white"
                      : currentStep === index + 1
                      ? "bg-blue-500 text-white"
                      : "bg-gray-200 text-gray-500"
                  }
                `}
                >
                  {step.icon}
                </div>
                <div className="text-center mt-2">
                  <div className="text-sm font-medium text-gray-900">
                    {step.title}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {step.description}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white shadow rounded-lg p-8">
          {currentStep === 1 && (
            <div className="text-center">
              <h2 className="text-2xl font-semibold mb-4">
                Connect to DigiLocker
              </h2>
              <p className="text-gray-600 mb-6">
                Click below to securely connect your DigiLocker account
              </p>
              <button
                onClick={handleDigilockerConnect}
                className="bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 transition-colors"
              >
                Connect DigiLocker
              </button>
            </div>
          )}

          {currentStep === 2 && (
            <div className="text-center">
              <h2 className="text-2xl font-semibold mb-4">Share Aadhar Card</h2>
              <p className="text-gray-600 mb-6">
                Select your Aadhar card from DigiLocker to share
              </p>
              <button
                onClick={() => window.open(link, "_self")}
                className="bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 transition-colors"
              >
                Open DigiLocker
              </button>
            </div>
          )}

          {currentStep === 3 && (
            <div className="text-center">
              <h2 className="text-2xl font-semibold mb-4">
                Generating Credentials
              </h2>
              <p className="text-gray-600 mb-6">
                Please wait while we generate your verifiable credentials
              </p>
              <button
                onClick={handleIssueCredentials}
                className="bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 transition-colors"
              >
                Get Verifiable Credentials
              </button>
            </div>
          )}

          {currentStep === 4 && (
            <div className="text-center">
              <h2 className="text-2xl font-semibold mb-4">
                Receive Your Credentials
              </h2>
              <p className="text-gray-600 mb-6">
                Scan the QR code or connect your wallet to receive credentials
              </p>
              <div className="flex flex-col items-center gap-6">
                {/* QR Code with client-side rendering */}
                {typeof window !== "undefined" && (
                  <div className="w-64 h-64 bg-white p-4 rounded-lg shadow-md">
                    <img
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(
                        deepLink || ""
                      )}`}
                      alt="Credential QR Code"
                      className="w-full h-full"
                    />
                  </div>
                )}

                {/* Web Wallet Button */}
                <button
                  onClick={() => {
                    if (typeof window !== "undefined") {
                      window.open(universalLink, "_blank");
                    }
                  }}
                  className="bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 transition-colors"
                >
                  Add to Web Wallet
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

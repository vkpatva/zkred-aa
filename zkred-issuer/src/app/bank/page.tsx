"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";

export default function Bank() {
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mobileNumber, setMobileNumber] = useState("");
  const [consentUrl, setConsentUrl] = useState("");
  const [deepLink, setDeepLink] = useState("");
  const [universalLink, setUniversalLink] = useState("");
  const searchParams = useSearchParams();
  const [dataId, setDataId] = useState("");

  const steps = [
    {
      title: "Enter Mobile",
      description: "Provide your registered mobile number",
      icon: "📱",
    },
    {
      title: "Give Consent",
      description: "Authorize access to your bank details",
      icon: "✅",
    },
    {
      title: "Generate Credentials",
      description: "Create verifiable bank credentials",
      icon: "🔐",
    },
    {
      title: "Receive Credentials",
      description: "Get your credentials via QR code or wallet",
      icon: "💳",
    },
  ];

  useEffect(() => {
    const handleRedirect = async () => {
      const fi = searchParams.get("fi");
      const resdate = searchParams.get("resdate");
      const ecres = searchParams.get("ecres");

      if (fi && resdate && ecres) {
        setIsLoading(true);
        setError(null);

        try {
          const response = await fetch("/api/bank/decode-redirect", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ fi, resdate, ecres }),
          });

          const data = await response.json();
          if (data) {
            setCurrentStep(3);
            setDataId(data.id);
          } else {
            setError("Failed to process bank response. Please try again.");
          }
        } catch (error) {
          setError("Failed to process bank response. Please try again.");
          console.error(error);
        } finally {
          setIsLoading(false);
        }
      }
    };

    handleRedirect();
  }, [searchParams]);

  const handleGenerateConsent = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/bank/generate-consent", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ mobileNumber }),
      });

      const data = await response.json();
      if (data.url) {
        setConsentUrl(data.url);
        setCurrentStep(2);
      }
    } catch (error) {
      setError("Failed to generate consent request. Please try again.");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleIssueCredentials = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/bank/issue-credential?dataId=${dataId}`,
        {
          method: "GET",
        }
      );

      const data = await response.json();
      setDeepLink(data.deepLink);
      setUniversalLink(data.universalLink);
      setCurrentStep(4);
    } catch (error) {
      setError("Failed to issue credentials. Please try again.");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-center text-gray-900 mb-12">
          Bank Account Verification
        </h1>

        {/* Steps Progress Bar */}
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

        {/* Main Content Area */}
        <div className="bg-white shadow rounded-lg p-8">
          {currentStep === 1 && (
            <div className="text-center">
              <h2 className="text-2xl font-semibold mb-4">
                Enter Mobile Number
              </h2>
              <p className="text-gray-600 mb-6">
                Please enter your bank-registered mobile number
              </p>
              <input
                type="tel"
                value={mobileNumber}
                onChange={(e) => setMobileNumber(e.target.value)}
                placeholder="Enter mobile number"
                className="block w-full max-w-xs mx-auto mb-4 p-2 border rounded"
              />
              <button
                onClick={handleGenerateConsent}
                disabled={!mobileNumber || mobileNumber.length !== 10}
                className="bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 transition-colors disabled:bg-gray-300"
              >
                Continue
              </button>
            </div>
          )}

          {currentStep === 2 && (
            <div className="text-center">
              <h2 className="text-2xl font-semibold mb-4">Provide Consent</h2>
              <p className="text-gray-600 mb-6">
                Please authorize access to your bank account details
              </p>
              <button
                onClick={() => {
                  window.open(consentUrl, "_self");
                  setCurrentStep(3);
                }}
                className="bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 transition-colors"
              >
                Open Consent Page
              </button>
            </div>
          )}

          {currentStep === 3 && (
            <div className="text-center">
              <h2 className="text-2xl font-semibold mb-4">
                Generate Credentials
              </h2>
              <p className="text-gray-600 mb-6">
                Click below to generate your verifiable bank credentials
              </p>
              <button
                onClick={handleIssueCredentials}
                className="bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 transition-colors"
              >
                Generate Credentials
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

                <button
                  onClick={() => window.open(universalLink, "_blank")}
                  className="bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 transition-colors"
                >
                  Add to Web Wallet
                </button>
              </div>
            </div>
          )}

          {error && (
            <div className="mt-4 text-red-500 text-center">{error}</div>
          )}
        </div>
      </div>
    </div>
  );
}

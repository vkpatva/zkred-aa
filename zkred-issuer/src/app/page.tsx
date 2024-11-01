"use client";
import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronRight, CreditCard, Building2, Wallet } from "lucide-react";

const UseCaseCard = ({
  title,
  description,
  useCase,
  icon: Icon,
  redirect,
}: {
  title: string;
  description: string;
  useCase: string[];
  icon: React.ElementType;
  redirect: string;
}) => (
  <Card className="bg-white border border-gray-200 mb-4 hover:bg-gray-50 transition-colors shadow-sm">
    <CardContent className="p-6">
      <div className="flex items-start gap-6">
        <div className="w-20 h-20 flex-shrink-0 bg-blue-50 rounded-full flex items-center justify-center">
          <Icon size={32} className="text-blue-600" />
        </div>

        <div className="flex-grow">
          <h3 className="text-xl font-semibold text-gray-900 mb-2">{title}</h3>
          <p className="text-gray-600 mb-4">{description}</p>

          <div className="space-y-2">
            <p className="text-sm font-medium text-gray-700">
              Where it can be used:
            </p>
            {useCase.map((doc, index) => (
              <div
                key={index}
                className="flex items-center gap-2 text-gray-600"
              >
                <div className="w-4 h-4 rounded-full bg-blue-100 flex items-center justify-center">
                  <ChevronRight size={12} className="text-blue-600" />
                </div>
                {doc}
              </div>
            ))}
          </div>
        </div>

        <Button
          className="bg-blue-600 text-white hover:bg-blue-700 self-start"
          onClick={() => {
            window.location.href = redirect;
          }}
        >
          START
        </Button>
      </div>
    </CardContent>
  </Card>
);

const AccountAggregatorDashboard = () => {
  const useCases = [
    {
      title: "Aadhar Card Verification",
      description:
        "Get a Verifiable Credential for your Aadhar Card through secure DigiLocker verification.",
      icon: Building2,
      useCase: [
        "Identity Verification for KYC",
        "Government Services",
        "Financial Services",
        "Employment Verification",
        "Education Verification",
      ],
      redirect: "/aadhar",
    },
    {
      title: "Bank Account Verification",
      description:
        "Securely share your banking information as Verifiable Credentials for various financial services.",
      icon: Wallet,
      useCase: [
        "Loan Applications",
        "Insurance Claims",
        "Account Balance Verification",
        "Term Deposit Proof",
        "Recurring Deposit Verification",
      ],
      redirect: "/bank",
    },
    {
      title: "Insurance Verification",
      description:
        "Create Verifiable Credentials for your insurance policies and coverage details.",
      icon: CreditCard,
      useCase: [
        "Policy Verification",
        "Coverage Proof",
        "Claims History",
        "Premium Payment Status",
        "Insurance Portfolio Overview",
      ],
      redirect: "/insurance",
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 p-8">
      <div className="max-w-6xl mx-auto">
        <header className="flex justify-between items-center mb-12">
          <div className="text-2xl font-bold">ZKAAccess</div>
        </header>

        <div className="grid grid-cols-1 gap-8">
          <div className="col-span-2">
            <div className="space-y-4">
              {useCases.map((useCase, index) => (
                <UseCaseCard key={index} {...useCase} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AccountAggregatorDashboard;

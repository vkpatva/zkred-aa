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
  <Card className="bg-zinc-900 mb-4 hover:bg-zinc-800 transition-colors">
    <CardContent className="p-6">
      <div className="flex items-start gap-6">
        <div className="w-20 h-20 flex-shrink-0 bg-zinc-800 rounded-full flex items-center justify-center">
          <Icon size={32} className="text-blue-400" />
        </div>

        <div className="flex-grow">
          <h3 className="text-xl font-semibold text-white mb-2">{title}</h3>
          <p className="text-gray-400 mb-4">{description}</p>

          <div className="space-y-2">
            <p className="text-sm font-medium text-gray-300">
              Where it can be used:
            </p>
            {useCase.map((doc, index) => (
              <div
                key={index}
                className="flex items-center gap-2 text-gray-400"
              >
                <div className="w-4 h-4 rounded-full bg-blue-500/20 flex items-center justify-center">
                  <ChevronRight size={12} className="text-blue-400" />
                </div>
                {doc}
              </div>
            ))}
          </div>
        </div>

        <Button
          className="bg-white text-black hover:bg-gray-200 self-start"
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
        "Get a Verifiable Credentials for your Aadhar Card by verifying from DigiLocker.",
      icon: Building2,
      useCase: [
        "Buy a SIM Card",
        "Open a Bank Account",
        "Get a Loan",
        "Validate your Identity for Insurance",
        "Apply for a Credit Card",
      ],
      redirect: "/aadhar",
    },
    {
      title: "Investment Portfolio Analysis",
      description:
        "Link your investment accounts to get a comprehensive view of your portfolio performance.",
      icon: Wallet,
      useCase: [
        "Mutual Fund Statements",
        "Demat Account Details",
        "Investment Holdings",
      ],
      redirect: "/aadhar",
    },
    {
      title: "Credit Assessment",
      description:
        "Share your financial data securely for quick and accurate credit assessment.",
      icon: CreditCard,
      useCase: [
        "Bank Statements",
        "Credit Card Statements",
        "Loan Account Details",
      ],
      redirect: "/aadhar",
    },
  ];

  return (
    <div className="min-h-screen bg-zinc-950 text-white p-8">
      <div className="max-w-6xl mx-auto">
        <header className="flex justify-between items-center mb-12">
          <div className="text-2xl font-bold">Zkred Issuer</div>
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

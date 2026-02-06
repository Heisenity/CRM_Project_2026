"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { CalendarDays, ExternalLink, Clock, Users, Video } from "lucide-react";

interface Customer {
  id: string;
  customerId: string;
  name: string;
  phone: string;
  email?: string;
}

interface MeetingSchedulerProps {
  customer?: Customer;
  isOpen: boolean;
  onClose: () => void;
}

export default function MeetingScheduler({ customer, isOpen, onClose }: MeetingSchedulerProps) {
  const [isCalendlyLoaded, setIsCalendlyLoaded] = useState(false);

  useEffect(() => {
    // Load Calendly widget script
    const script = document.createElement('script');
    script.src = 'https://assets.calendly.com/assets/external/widget.js';
    script.async = true;
    script.onload = () => setIsCalendlyLoaded(true);
    document.head.appendChild(script);

    return () => {
      // Cleanup script if component unmounts
      const existingScript = document.querySelector('script[src="https://assets.calendly.com/assets/external/widget.js"]');
      if (existingScript) {
        document.head.removeChild(existingScript);
      }
    };
  }, []);

  const openCalendlyInNewWindow = () => {
    if (!customer) return;

    const calendlyUrl = `${process.env.NEXT_PUBLIC_CALENDLY_URL || 'https://calendly.com/your-calendly-username'}?name=${encodeURIComponent(customer.name)}&email=${encodeURIComponent(customer.email || '')}&a1=${encodeURIComponent(customer.customerId)}&a2=${encodeURIComponent(customer.phone)}`;
    
    window.open(calendlyUrl, '_blank', 'width=900,height=700,scrollbars=yes,resizable=yes');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <CalendarDays className="h-6 w-6 text-blue-600" />
            Schedule New Meeting
          </DialogTitle>
          <DialogDescription className="text-base">
            {customer ? `Create a new meeting manually or use Calendly for scheduling` : 'Create a new meeting manually or use Calendly for scheduling'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Meeting Type Selection */}
          <div className="flex gap-4">
            <Button variant="outline" className="flex-1 h-auto py-4 border-2">
              <div className="text-center">
                <div className="font-semibold text-base mb-1">Manual Creation</div>
              </div>
            </Button>
            <Button variant="outline" className="flex-1 h-auto py-4 border-2 border-blue-200 bg-blue-50">
              <div className="text-center">
                <div className="font-semibold text-base mb-1">Calendly Integration</div>
              </div>
            </Button>
          </div>

          {/* Meeting Options Grid */}
          <div className="grid grid-cols-2 gap-6">
            {/* Client Meeting Card */}
            <Card className="border-2 hover:border-blue-300 transition-colors">
              <CardHeader className="pb-4">
                <div className="flex items-center gap-2 mb-2">
                  <Users className="h-5 w-5 text-blue-600" />
                  <CardTitle className="text-lg">Client Meeting</CardTitle>
                </div>
                <CardDescription className="text-sm">
                  Schedule a meeting with a customer using Calendly
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {customer && (
                  <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                    <div className="text-sm font-medium text-gray-700">Select Customer</div>
                    <div className="text-sm text-gray-600">
                      <div className="font-medium text-gray-900">{customer.name}</div>
                      <div className="text-xs mt-1">ID: {customer.customerId}</div>
                    </div>
                  </div>
                )}
                <Button
                  onClick={openCalendlyInNewWindow}
                  className="w-full"
                  size="lg"
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Open Calendly for Customer
                </Button>
                <p className="text-xs text-gray-500 text-center">
                  Customer details will be pre-filled in Calendly
                </p>
              </CardContent>
            </Card>

            {/* Team Meeting Card */}
            <Card className="border-2 hover:border-green-300 transition-colors">
              <CardHeader className="pb-4">
                <div className="flex items-center gap-2 mb-2">
                  <Users className="h-5 w-5 text-green-600" />
                  <CardTitle className="text-lg">Team Meeting</CardTitle>
                </div>
                <CardDescription className="text-sm">
                  Schedule an internal team meeting using Calendly
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                  <div className="text-sm font-medium text-gray-700">Meeting Title</div>
                  <input
                    type="text"
                    placeholder="Enter meeting title"
                    className="w-full px-3 py-2 text-sm border rounded-md"
                  />
                </div>
                <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                  <div className="text-sm font-medium text-gray-700">Quick Attendee Selection</div>
                  <select className="w-full px-3 py-2 text-sm border rounded-md text-gray-500">
                    <option>Select team members</option>
                  </select>
                </div>
                <Button
                  className="w-full"
                  size="lg"
                  variant="outline"
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Open Calendly for Team Meeting
                </Button>
                <p className="text-xs text-gray-500 text-center">
                  Meeting details will be pre-filled in Calendly
                </p>
              </CardContent>
            </Card>
          </div>

          {/* How it works section */}
          <Card className="bg-blue-50 border-blue-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold text-blue-900">How it works:</CardTitle>
            </CardHeader>
            <CardContent>
              <ol className="space-y-2 text-sm text-blue-800">
                <li className="flex items-start gap-2">
                  <span className="font-semibold">1.</span>
                  <span>Select meeting type and attendees</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-semibold">2.</span>
                  <span>Click to open Calendly with pre-filled details</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-semibold">3.</span>
                  <span>Choose available time slots</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-semibold">4.</span>
                  <span>Calendly sends invitations automatically</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-semibold">5.</span>
                  <span>Meeting details sync back to your calendar</span>
                </li>
              </ol>
            </CardContent>
          </Card>

          {/* Available Meeting Types */}
          <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg">
            <Clock className="h-5 w-5 text-gray-600 mt-0.5" />
            <div className="flex-1">
              <p className="font-medium text-sm text-gray-900 mb-2">Available Meeting Types:</p>
              <div className="grid grid-cols-3 gap-3 text-xs text-gray-600">
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span>15-minute consultation</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>30-minute project discussion</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                  <span>60-minute detailed planning</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
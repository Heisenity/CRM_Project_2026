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
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarDays className="h-5 w-5 text-blue-600" />
            Schedule Meeting
          </DialogTitle>
          <DialogDescription>
            {customer ? `Schedule a meeting with ${customer.name}` : 'Schedule a new meeting'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {customer && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Customer Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <Users className="h-4 w-4 text-gray-500" />
                  <span className="font-medium">{customer.name}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <span>ID: {customer.customerId}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <span>Phone: {customer.phone}</span>
                </div>
                {customer.email && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <span>Email: {customer.email}</span>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          <div className="space-y-3">
            <h4 className="text-sm font-medium text-gray-900">Schedule Meeting</h4>
            
            <Button
              onClick={openCalendlyInNewWindow}
              className="w-full justify-start h-auto p-4"
            >
              <div className="flex items-start gap-3">
                <Video className="h-5 w-5 text-white mt-0.5" />
                <div className="text-left">
                  <div className="font-medium">Open Calendly Scheduler</div>
                  <div className="text-sm opacity-90">Schedule meeting with customer details pre-filled</div>
                </div>
              </div>
            </Button>
          </div>

          <div className="pt-4 border-t">
            <div className="flex items-start gap-2 text-xs text-gray-500">
              <Clock className="h-4 w-4 mt-0.5" />
              <div>
                <p className="font-medium">Available Meeting Types:</p>
                <ul className="mt-1 space-y-1">
                  <li>• 15-minute consultation</li>
                  <li>• 30-minute project discussion</li>
                  <li>• 60-minute detailed planning</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="flex gap-2 pt-4">
            <Button onClick={onClose} variant="outline" className="flex-1">
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Search, Plus, User } from 'lucide-react';
import { useCustomers } from '@/hooks/useCustomers';
import { SaleCustomer } from '@/types/cashdesk';
import { Customer } from '@/types'; // Import Customer type

interface CustomerSelectorProps {
  onSelectCustomer: (customer: SaleCustomer) => void;
  onClose: () => void;
}

const CustomerSelector: React.FC<CustomerSelectorProps> = ({ onSelectCustomer, onClose }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showNewForm, setShowNewForm] = useState(false);
  const [newCustomer, setNewCustomer] = useState({
    name: '',
    phone: '',
    email: ''
  });
  const { customers, handleAddCustomer } = useCustomers();

  const filteredCustomers = customers.filter(customer =>
    customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (customer.phone && customer.phone.includes(searchTerm)) ||
    (customer.email && customer.email.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleWalkIn = () => {
    onSelectCustomer({ isWalkIn: true });
  };

  const handleSelectExisting = (customer: Customer) => { // Use Customer type
    onSelectCustomer({
      id: customer.id,
      name: customer.name,
      phone: customer.phone,
      email: customer.email,
      tier: 'regular' // Default tier
    });
  };

  const handleCreateNew = async () => {
    if (!newCustomer.name.trim()) return;

    const created = await handleAddCustomer(newCustomer);
    if (created) {
      onSelectCustomer({
        id: created.id,
        name: created.name,
        phone: created.phone,
        email: created.email,
        tier: 'regular'
      });
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Select Customer</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {!showNewForm ? (
            <>
              <Button 
                onClick={handleWalkIn}
                variant="outline" 
                className="w-full justify-start"
              >
                <User className="mr-2 h-4 w-4" />
                Walk-in Customer
              </Button>

              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search customers..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              <div className="max-h-48 overflow-y-auto space-y-2">
                {filteredCustomers.map((customer) => (
                  <div
                    key={customer.id}
                    onClick={() => handleSelectExisting(customer)}
                    className="p-3 border rounded-lg cursor-pointer hover:bg-muted/50"
                  >
                    <div className="font-medium">{customer.name}</div>
                    {customer.phone && (
                      <div className="text-sm text-muted-foreground">{customer.phone}</div>
                    )}
                  </div>
                ))}
              </div>

              <Button 
                onClick={() => setShowNewForm(true)}
                variant="outline" 
                className="w-full"
              >
                <Plus className="mr-2 h-4 w-4" />
                Add New Customer
              </Button>
            </>
          ) : (
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  value={newCustomer.name}
                  onChange={(e) => setNewCustomer({ ...newCustomer, name: e.target.value })}
                  placeholder="Customer name"
                />
              </div>

              <div>
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  value={newCustomer.phone}
                  onChange={(e) => setNewCustomer({ ...newCustomer, phone: e.target.value })}
                  placeholder="Phone number"
                />
              </div>

              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={newCustomer.email}
                  onChange={(e) => setNewCustomer({ ...newCustomer, email: e.target.value })}
                  placeholder="Email address"
                />
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={() => setShowNewForm(false)}
                  variant="outline"
                  className="flex-1"
                >
                  Back
                </Button>
                <Button
                  onClick={handleCreateNew}
                  disabled={!newCustomer.name.trim()}
                  className="flex-1"
                >
                  Create
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CustomerSelector;


import React, { useState } from 'react';
import { useCustomers } from '@/hooks/useCustomers';
import { Customer } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { UserPlus, ArrowLeft } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

interface CustomerSelectionProps {
  selectedCustomer: Customer | null;
  onSelectCustomer: (customer: Customer) => void;
  showNewCustomerForm: boolean;
  setShowNewCustomerForm: (show: boolean) => void;
  onCreateCustomer: (customer: Partial<Customer>) => void;
}

const CustomerSelection: React.FC<CustomerSelectionProps> = ({
  selectedCustomer,
  onSelectCustomer,
  showNewCustomerForm,
  setShowNewCustomerForm,
  onCreateCustomer
}) => {
  const { customers, loading } = useCustomers();
  const [searchTerm, setSearchTerm] = useState('');
  const [newCustomer, setNewCustomer] = useState<Partial<Customer>>({
    name: '',
    phone: '',
    email: '',
    address: '',
  });

  const filteredCustomers = searchTerm 
    ? customers.filter(c => 
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (c.phone && c.phone.includes(searchTerm)) ||
        (c.email && c.email.toLowerCase().includes(searchTerm.toLowerCase()))
      )
    : customers.slice(0, 5); // Show only top 5 if no search term

  const handleCreateCustomer = () => {
    onCreateCustomer(newCustomer);
    setNewCustomer({
      name: '',
      phone: '',
      email: '',
      address: '',
    });
  };

  if (selectedCustomer) {
    return (
      <div className="space-y-4">
        <div className="p-4 border rounded-md">
          <h3 className="font-medium mb-2">{selectedCustomer.name}</h3>
          {selectedCustomer.phone && <p className="text-sm text-muted-foreground">{selectedCustomer.phone}</p>}
          {selectedCustomer.email && <p className="text-sm text-muted-foreground">{selectedCustomer.email}</p>}
          {selectedCustomer.address && <p className="text-sm text-muted-foreground">{selectedCustomer.address}</p>}
        </div>
        <Button variant="outline" onClick={() => onSelectCustomer({} as Customer)} className="w-full">
          Change Customer
        </Button>
      </div>
    );
  }

  if (showNewCustomerForm) {
    return (
      <div className="space-y-4">
        <Button 
          variant="link" 
          onClick={() => setShowNewCustomerForm(false)} 
          className="pl-0 flex items-center"
        >
          <ArrowLeft className="mr-1 h-4 w-4" /> Back to customer list
        </Button>
        
        <div className="space-y-3">
          <div>
            <Label htmlFor="name">Name</Label>
            <Input 
              id="name" 
              placeholder="Customer name" 
              value={newCustomer.name || ''}
              onChange={(e) => setNewCustomer({...newCustomer, name: e.target.value})}
              required
            />
          </div>
          
          <div>
            <Label htmlFor="phone">Phone</Label>
            <Input 
              id="phone" 
              placeholder="Phone number" 
              value={newCustomer.phone || ''}
              onChange={(e) => setNewCustomer({...newCustomer, phone: e.target.value})}
            />
          </div>
          
          <div>
            <Label htmlFor="email">Email</Label>
            <Input 
              id="email" 
              placeholder="Email address" 
              type="email"
              value={newCustomer.email || ''}
              onChange={(e) => setNewCustomer({...newCustomer, email: e.target.value})}
            />
          </div>
          
          <div>
            <Label htmlFor="address">Address</Label>
            <Input 
              id="address" 
              placeholder="Address" 
              value={newCustomer.address || ''}
              onChange={(e) => setNewCustomer({...newCustomer, address: e.target.value})}
            />
          </div>
          
          <Button 
            className="w-full" 
            onClick={handleCreateCustomer}
            disabled={!newCustomer.name}
          >
            Save Customer
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <Input 
          placeholder="Search by name, phone, or email" 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>
      
      <div className="space-y-2 max-h-72 overflow-y-auto">
        {loading ? (
          <div className="text-center py-4">Loading customers...</div>
        ) : filteredCustomers.length > 0 ? (
          filteredCustomers.map((customer) => (
            <Card 
              key={customer.id} 
              className="cursor-pointer hover:bg-muted transition-colors"
              onClick={() => onSelectCustomer(customer)}
            >
              <CardContent className="p-3">
                <h3 className="font-medium">{customer.name}</h3>
                {customer.phone && <p className="text-xs text-muted-foreground">{customer.phone}</p>}
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="text-center py-4">No customers found</div>
        )}
      </div>
      
      <Button onClick={() => setShowNewCustomerForm(true)} variant="outline" className="w-full">
        <UserPlus className="mr-2 h-4 w-4" /> New Customer
      </Button>
    </div>
  );
};

export default CustomerSelection;

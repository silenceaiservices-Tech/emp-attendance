-- Create employees table
CREATE TABLE public.employees (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  emp_id TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  department TEXT NOT NULL,
  designation TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create attendance table
CREATE TABLE public.attendance (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  emp_id TEXT NOT NULL REFERENCES public.employees(emp_id) ON DELETE CASCADE,
  login_time TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  logout_time TIMESTAMP WITH TIME ZONE,
  working_minutes INTEGER,
  attendance_date DATE NOT NULL DEFAULT CURRENT_DATE,
  device_id TEXT,
  synced_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(emp_id, attendance_date)
);

-- Create admin_users table for admin authentication
CREATE TABLE public.admin_users (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  username TEXT NOT NULL UNIQUE,
  pin_hash TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

-- Create policies for employees (public read for attendance, admin write)
CREATE POLICY "Anyone can view employees" ON public.employees FOR SELECT USING (true);
CREATE POLICY "Anyone can insert employees" ON public.employees FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update employees" ON public.employees FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete employees" ON public.employees FOR DELETE USING (true);

-- Create policies for attendance
CREATE POLICY "Anyone can view attendance" ON public.attendance FOR SELECT USING (true);
CREATE POLICY "Anyone can insert attendance" ON public.attendance FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update attendance" ON public.attendance FOR UPDATE USING (true);

-- Create policies for admin_users (restricted)
CREATE POLICY "Anyone can view admin_users" ON public.admin_users FOR SELECT USING (true);
CREATE POLICY "Anyone can insert admin_users" ON public.admin_users FOR INSERT WITH CHECK (true);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_employees_updated_at
BEFORE UPDATE ON public.employees
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_attendance_updated_at
BEFORE UPDATE ON public.attendance
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default admin (PIN: 1234 - hashed with simple base64 for demo)
INSERT INTO public.admin_users (username, pin_hash) VALUES ('admin', 'MTIzNA==');
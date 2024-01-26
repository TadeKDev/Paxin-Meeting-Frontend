'use client';

import { useContext, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { PaxContext } from '@/context/context';
import { zodResolver } from '@hookform/resolvers/zod';
import axios from 'axios';
import { Loader2, Lock, Mail } from 'lucide-react';
import { parseCookies, setCookie } from 'nookies';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import * as z from 'zod';

import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';

const formSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters long'),
});

type UserFormValue = z.infer<typeof formSchema>;

export function SignInCard() {
  const { socket } = useContext(PaxContext);
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const defaultValues = {
    email: '',
    password: '',
  };
  const form = useForm<UserFormValue>({
    resolver: zodResolver(formSchema),
    defaultValues,
  });

  const onSubmit = async (data: UserFormValue) => {
    setLoading(true);

    try {
      const response = await axios.post(
        '/api/auth/login',
        {
          email: data.email,
          password: data.password,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
        }
      );

      const result = response.data;
      console.log(result, 'result');

      if (result.status === 'success') {
        toast.success("Welcome back! You've logged in successfully.", {
          position: 'top-right',
        });

        setCookie(null, 'access_token', result?.access_token);
        setCookie(null, 'refresh_token', result?.refresh_token, {
          maxAge: 60 * 60 * 24 * 7,
          sameSite: 'lax',
        });

        router.push('/profile/dashboard');
      } else {
        toast.error(result.message, {
          position: 'top-right',
        });
      }
    } catch (error) {
      toast.error('Something went wrong. Please try again.', {
        position: 'top-right',
      });
    }

    setLoading(false);
  };

  useEffect(() => {
    const { access_token } = parseCookies();

    if (access_token) {
      axios
        .post(`/api/auth/checkTokenExp`, {}, { params: { access_token } })
        .then((res) => {
          if (res.data.status === 'success') {
            router.push('/profile/dashboard');
          }
        })
        .catch((err) => {
          console.log(err.message);
        });
    }
  }, []);

  return (
    <div className='flex size-full flex-col items-center justify-center'>
      <div className='text-center text-2xl sm:text-3xl'>
        <span>Welcome to</span>{' '}
        <span className='font-bold text-primary'>PaxinTrade</span>
      </div>
      <div className='mt-8 flex w-full max-w-sm flex-col gap-3'>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className='w-full space-y-2'
          >
            <FormField
              control={form.control}
              name='email'
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <div className='relative mx-auto w-full'>
                      <Mail className='absolute inset-y-0 left-3 my-auto h-4 w-4 text-gray-500' />
                      <Input
                        type='email'
                        placeholder='Email'
                        className='pl-12 pr-4'
                        disabled={loading}
                        {...field}
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name='password'
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <div className='relative mx-auto w-full'>
                      <Lock className='absolute inset-y-0 left-3 my-auto h-4 w-4 text-gray-500' />
                      <Input
                        type='password'
                        placeholder='Password'
                        className='pl-12 pr-4'
                        disabled={loading}
                        {...field}
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className='flex w-full justify-end'>
              <Button variant='link' asChild>
                <Link href='/auth/forgot-password'>Forgot password?</Link>
              </Button>
            </div>
            <Button
              type='submit'
              variant='default'
              className='w-full'
              disabled={loading}
            >
              {loading && <Loader2 className='mr-2 h-4 w-4 animate-spin' />}
              Sign In
            </Button>
          </form>
        </Form>
      </div>
      <div className='mt-8 w-full max-w-sm space-y-4'>
        <div className='text-center'>{"Don't have an account? Setup Now"}</div>
        <Button
          variant='outline'
          className='w-full border-primary text-primary'
          asChild
        >
          <Link href='/auth/signup'>Sign Up</Link>
        </Button>
      </div>
    </div>
  );
}

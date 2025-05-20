"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import { Mail, Phone, ShieldCheck } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/card.tsx"
import { Skeleton } from "../../../components/ui/skeleton.tsx"
import myGif from "./PubUS.gif";

export default function AboutUs() {
  const [company, setCompany] = useState(null)
  const [loading, setLoading] = useState(true)
  const API_BASE_URL = process.env.REACT_APP_API_URL

  useEffect(() => {
    async function fetchCompanyData() {
      try {
        setLoading(true)
        const response = await fetch(`${API_BASE_URL}/api/v1/company`, {
          method: "GET",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
          },
        })

        if (!response.ok) {
          throw new Error(`Error fetching data: ${response.statusText}`)
        }

        const data = await response.json()
        setCompany(data)
      } catch (error) {
        console.error("Error during data fetching:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchCompanyData()
  }, [API_BASE_URL])

  return (
    <div className="container mx-auto px-4 py-12 max-w-6xl">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        <div className="relative overflow-hidden rounded-2xl shadow-xl transition-all duration-300 hover:shadow-2xl">
          <div className="aspect-video w-full relative">
            {/* Replace with your actual GIF path */}
            <Image
              src={myGif}
              alt="Company Presentation"
              className="object-cover"
              fill
              sizes="(max-width: 768px) 100vw, 50vw"
              priority
            />
          </div>
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 transition-opacity duration-300 hover:opacity-100" />
        </div>

        <Card className="border-none shadow-lg">
          <CardHeader className="pb-2">
            <CardTitle className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              {loading ? <Skeleton className="h-10 w-3/4" /> : company?.name}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {loading ? (
              <div className="space-y-4">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-4 w-2/3" />
              </div>
            ) : (
              <>
                <div className="prose max-w-none">
                  <p className="text-gray-700 dark:text-gray-300 leading-relaxed">{company?.description}</p>
                </div>

                <div className="grid gap-4">
                  <h3 className="text-xl font-semibold">Contact Information</h3>
                  <div className="grid gap-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-100 dark:bg-purple-900/30">
                        <Phone className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Phone</p>
                        <p className="font-medium">{company?.phone}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-100 dark:bg-purple-900/30">
                        <Mail className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Email</p>
                        <p className="font-medium">{company?.email}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-200 dark:border-gray-800">
                  <div className="flex items-center gap-2 mb-4">
                    <ShieldCheck className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                    <h3 className="text-xl font-semibold">Support</h3>
                  </div>
                  <div className="grid gap-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-pink-100 dark:bg-pink-900/30">
                        <Phone className="h-5 w-5 text-pink-600 dark:text-pink-400" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Support Phone</p>
                        <p className="font-medium">{company?.supportPhone}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-pink-100 dark:bg-pink-900/30">
                        <Mail className="h-5 w-5 text-pink-600 dark:text-pink-400" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Support Email</p>
                        <p className="font-medium">{company?.supportEmail}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

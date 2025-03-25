"use client"

import React, { useState } from "react";
import { Button } from "../../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { X, Plus } from "lucide-react";

// Define the Simple Profile type
interface Study {
  degree: string;
  institution: string;
  year: string;
}

interface Job {
  title: string;
  company: string;
  years: string;
}

interface SimpleProfile {
  firstName: string;
  lastName: string;
  avatar: string;
  studies: Study[];
  job: Job;
}

interface SimpleProfileFormProps {
  profile: SimpleProfile;
  onSave: (profile: SimpleProfile) => void;
}

export function SimpleProfileForm({ profile, onSave }: SimpleProfileFormProps) {
  const [editableProfile, setEditableProfile] = useState<SimpleProfile>(profile);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>, section: string | null = null, index: number | null = null, field: string | null = null) => {
    if (section && index !== null && field) {
      // Handle array items (like studies)
      if (section === 'studies') {
        const newStudies = [...editableProfile.studies];
        newStudies[index] = { ...newStudies[index], [field]: e.target.value };
        setEditableProfile({ ...editableProfile, studies: newStudies });
      }
    } else if (section && field) {
      // Handle nested objects (like job)
      if (section === 'job') {
        setEditableProfile({
          ...editableProfile,
          job: { ...editableProfile.job, [field]: e.target.value }
        });
      }
    } else {
      // Handle top-level fields
      setEditableProfile({ ...editableProfile, [e.target.name]: e.target.value });
    }
  };

  const addStudy = () => {
    setEditableProfile({
      ...editableProfile,
      studies: [...editableProfile.studies, { degree: '', institution: '', year: '' }]
    });
  };

  const removeStudy = (index: number) => {
    const newStudies = [...editableProfile.studies];
    newStudies.splice(index, 1);
    setEditableProfile({ ...editableProfile, studies: newStudies });
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    onSave(editableProfile);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Basic Information</CardTitle>
          <CardDescription>Update your personal details</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name</Label>
              <Input
                id="firstName"
                name="firstName"
                value={editableProfile.firstName}
                onChange={handleChange}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name</Label>
              <Input
                id="lastName"
                name="lastName"
                value={editableProfile.lastName}
                onChange={handleChange}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Professional Information</CardTitle>
          <CardDescription>Update your job details</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="jobTitle">Job Title</Label>
            <Input
              id="jobTitle"
              value={editableProfile.job.title}
              onChange={(e) => handleChange(e, 'job', null, 'title')}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="jobCompany">Company</Label>
            <Input
              id="jobCompany"
              value={editableProfile.job.company}
              onChange={(e) => handleChange(e, 'job', null, 'company')}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="jobYears">Years</Label>
            <Input
              id="jobYears"
              value={editableProfile.job.years}
              onChange={(e) => handleChange(e, 'job', null, 'years')}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Education</CardTitle>
            <CardDescription>Add your educational background</CardDescription>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addStudy}
          >
            <Plus className="h-4 w-4 mr-2" /> Add Education
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {editableProfile.studies.map((study, index) => (
            <div key={index} className="relative border p-4 rounded-md">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-2 top-2"
                onClick={() => removeStudy(index)}
              >
                <X className="h-4 w-4" />
              </Button>
              <div className="grid gap-4">
                <div className="space-y-2">
                  <Label>Degree</Label>
                  <Input
                    value={study.degree}
                    onChange={(e) => handleChange(e, 'studies', index, 'degree')}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Institution</Label>
                  <Input
                    value={study.institution}
                    onChange={(e) => handleChange(e, 'studies', index, 'institution')}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Year</Label>
                  <Input
                    value={study.year}
                    onChange={(e) => handleChange(e, 'studies', index, 'year')}
                  />
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button type="submit">Save Profile</Button>
      </div>
    </form>
  );
}

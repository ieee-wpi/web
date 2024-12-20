import React, { useState } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronDown } from "lucide-react";

interface Officer {
  position: string;
  name: string | string[];
}

interface OfficerBoard {
  year: string;
  officers: Officer[];
}

const officerBoards: OfficerBoard[] = [
  {
    year: '2023',
    officers: [
      { position: 'President', name: 'Will Buchta' },
      { position: 'Vice President', name: 'Cather Zhang' },
      { position: 'Treasurer', name: 'Michael Dodge' },
      { position: 'Secretary', name: 'Abe Ibraheim' },
      { position: 'Workshops Chair', name: 'Thomas Rúa' },
      { position: 'Webmaster', name: 'Cather Zhang' },
      { position: 'Projects Chair', name: 'Roberto Sabater' },
      { position: 'Liaison', name: 'Addie Brachtl' },
      { position: 'PR Chair', name: 'Maria Cox' },
      { position: 'Events Chair', name: 'Hubert Liu' },
      { position: 'Faculty Advisor', name: 'Professor Wyglinski' },
    ],
  },
  {
    year: '2022',
    officers: [
      { position: 'President', name: '-' },
      { position: 'Vice President', name: '-' },
      { position: 'Treasurer', name: '-' },
      { position: 'Secretary', name: '-' },
      { position: 'Workshops Chair', name: '-' },
      { position: 'Webmaster', name: '-' },
      { position: 'Projects Chair', name: '-' },
      { position: 'Liaison', name: '-' },
      { position: 'PR Chair', name: '-' },
      { position: 'Events Chair', name: '-' },
      { position: 'Faculty Advisor', name: '-' },
    ],
  },
  {
    year: '2021',
    officers: [
      { position: 'President', name: 'Manjusha Chava' },
      { position: 'Vice President', name: 'Jonathan Ferreira' },
      { position: 'Treasurer', name: 'Troy Mullenberg' },
      { position: 'Secretary', name: 'Evan Sauter' },
      { position: 'Workshops Chair', name: 'Jason Jemison' },
      { position: 'Webmaster', name: 'Ben Guerriero' },
      { position: 'Liaison', name: 'Ben Guerriero' },
      { position: 'PR Chair', name: 'Troy Mullenberg' },
      { position: 'Events Chair', name: 'Jonathan Ferreira' },
      { position: 'Faculty Advisor', name: 'Professor Wyglinski' },
    ],
  },
  {
    year: '2020',
    officers: [
      { position: 'President', name: 'Manjusha Chava' },
      { position: 'Vice President', name: 'Eric Macorri' },
      { position: 'Treasurer', name: 'Eric Macorri' },
      { position: 'Secretary', name: 'Jonathan Ferreira' },
      { position: 'Workshops Chair', name: ['Jake Mercier', 'Nadia Singh'] },
      { position: 'Webmaster', name: 'Ben Guerriero' },
      { position: 'Projects Chair', name: 'Jake Mercier' },
      { position: 'Liaison', name: 'Jake Mercier' },
      { position: 'PR Chair', name: 'Nadia Singh' },
      { position: 'Events Chair', name: 'Serena Raso' },
      { position: 'Faculty Advisor', name: 'Professor Wyglinski' },
    ],
  },
  {
    year: '2019',
    officers: [
      { position: 'President', name: 'Quincy Rhodes' },
      { position: 'Vice President', name: 'Jason Jemison' },
      { position: 'Treasurer', name: 'Vien Le' },
      { position: 'Secretary', name: 'Bill Chieng' },
      { position: 'Workshops Chair', name: 'Jason Jemison' },
      { position: 'Webmaster', name: 'Bill Chieng' },
      { position: 'Projects Chair', name: 'Eric Macorri' },
      { position: 'Liaison', name: 'Manjusha Chava' },
      { position: 'PR Chair', name: 'Manjusha Chava' },
      { position: 'Events Chair', name: 'Serena Raso' },
      { position: 'Faculty Advisor', name: 'Professor Wyglinski' },
    ],
  },
  {
    year: '2018',
    officers: [
      { position: 'President', name: 'Christian Elzey' },
      { position: 'Vice President', name: 'Josue Contreras' },
      { position: 'Treasurer', name: 'Quincy Rhodes' },
      { position: 'Secretary', name: 'Mike Kane' },
      { position: 'Webmaster', name: 'Bill Chieng' },
      { position: 'Projects Chair', name: 'Quincy Rhodes' },
      { position: 'PR Chair', name: 'Maria Martinez' },
      { position: 'Events Chair', name: ['Serena Raso', 'Calum Briggs'] },
      { position: 'Faculty Advisor', name: 'Professor Wyglinski' },
    ],
  },
  {
    year: '2017',
    officers: [
      { position: 'President', name: 'Alex Briskman' },
      { position: 'Vice President', name: 'Jeff Martin' },
      { position: 'Treasurer', name: 'Daniel Peleaz' },
      { position: 'Secretary', name: 'Daniel Peleaz' },
      { position: 'Projects Chair', name: 'Christian Elzey' },
      { position: 'PR Chair', name: 'Linnea Brown' },
      { position: 'Events Chair', name: ['Michael Truong', 'Calum Briggs'] },
      { position: 'Faculty Advisor', name: 'Professor Wyglinski' },
    ],
  },
  {
    year: '2016',
    officers: [
      { position: 'President', name: 'Elizabeth Bliss' },
      { position: 'Vice President', name: 'Mariya Zagalskya' },
      { position: 'Treasurer', name: 'Sky Alsever' },
      { position: 'Secretary', name: 'Jeff Martin' },
      { position: 'Webmaster', name: 'Binam Kayastha' },
      { position: 'Projects Chair', name: ['Alex Briskman', 'Quyen Hoang'] },
      { position: 'Provisions & Accommodations Chair', name: 'Mike Inserra' },
      { position: 'PR Chair', name: 'Linnea Brown' },
      { position: 'Events Chair', name: ['Monineath Khun', 'Tom Brown'] },
      { position: 'Faculty Advisor', name: 'Professor Hakim' },
    ],
  },
  {
    year: '2015',
    officers: [
      { position: 'President', name: 'Truman Chojowski' },
      { position: 'Vice President', name: 'Zachary Culp' },
      { position: 'Treasurer', name: 'Alejandro Miranda' },
      { position: 'Secretary', name: 'Mariya Zagalskya' },
      { position: 'Lounge Manager', name: 'Sky Alsever' },
      { position: 'Webmaster', name: 'Jonathon Ho Wu' },
      { position: 'Projects Chair', name: ['Binam Kayastha', 'Andrew Weiler'] },
      { position: 'PR Chair', name: ['Alex Helderman', 'Adam Karcs'] },
      { position: 'Events Chair', name: ['Elizabeth Bliss', 'Alex Arnold'] },
      { position: 'Faculty Advisor', name: 'Professor Hakim' },
    ],
  },
  {
    year: '2014',
    officers: [
      { position: 'President', name: 'Stephanie Piscitelli' },
      { position: 'Vice President', name: 'Matthew Chase' },
      { position: 'Treasurer', name: 'Zachary Culp' },
      { position: 'Secretary', name: 'Truman Chojnowski' },
      { position: 'Activities Chair', name: 'Andrew Weiler' },
      { position: 'Webmaster', name: 'Jonathon Ho Wu' },
      { position: 'Lounge Manager', name: 'Stephanie Piscitelli' },
      { position: 'HKN Representative', name: 'Alex Helderman' },
      { position: 'Faculty Advisor', name: 'Professor Hakim' },
    ],
  },
  {
    year: '2013',
    officers: [
      { position: 'President', name: 'Caitlin Dragun' },
      { position: 'Vice President', name: 'Christian Lecorps' },
      { position: 'Treasurer', name: 'Zachary Culp' },
      { position: 'Secretary', name: 'Jordyn Rombola' },
      { position: 'Senior Advisor', name: 'Sebastian Courtney' },
      { position: 'Webmaster', name: 'Petra Hartman' },
      { position: 'Activities Chair', name: 'Andrew Weiler' },
      { position: 'Lounge Manager', name: 'Dan Hullihen' },
      { position: 'PR Chair', name: 'Darius Toussi' },
      { position: 'HKN Representative', name: 'Jordyn Rombola' },
      { position: 'Faculty Advisor', name: ['Professor Hakim', 'Professor Looft'] },
    ],
  },
];

const PastOfficers: React.FC = () => {
  const [expandedYear, setExpandedYear] = useState<string | null>(null);

  const toggleYear = (year: string) => {
    setExpandedYear(expandedYear === year ? null : year);
  };

  return (
    <section className="py-12">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-bold text-center mb-10">Past Officer Boards</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {officerBoards.map((board) => (
            <Card key={board.year} className="w-full">
              <CardHeader>
                <Button
                  variant="ghost"
                  onClick={() => toggleYear(board.year)}
                  className="w-full flex justify-between items-center hover:bg-transparent"
                >
                  <CardTitle>{board.year} Officers</CardTitle>
                  <ChevronDown 
                    className={`h-5 w-5 transition-transform ${
                      expandedYear === board.year ? 'rotate-180' : ''
                    }`}
                  />
                </Button>
              </CardHeader>
              {expandedYear === board.year && (
                <CardContent>
                  <table className="w-full">
                    <tbody>
                      {board.officers.map((officer, index) => (
                        <tr key={index} className={index % 2 === 0 ? 'bg-muted/50' : ''}>
                          <td className="py-2 px-4 text-sm">{officer.position}</td>
                          <td className="py-2 px-4 text-sm">
                            {Array.isArray(officer.name) 
                              ? officer.name.join(', ')
                              : officer.name}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default PastOfficers;

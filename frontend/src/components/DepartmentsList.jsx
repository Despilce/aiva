import { useState } from "react";

const departments = [
  {
    id: "SSU(Student Support Unit)",
    name: "SSU",
    fullName: "Student Support Unit",
    image: "/SSU.jpg",
    type: "image",
  },
  {
    id: "LRC(Learning Resource Center)",
    name: "LRC",
    fullName: "Learning Resource Center",
    image: "/LRC.jpg",
    type: "image",
  },
  {
    id: "EU(Exam Unit)",
    name: "EU",
    fullName: "Exam Unit",
    bgColor: "#4F46E5", // Indigo
    type: "letter",
  },
  {
    id: "IT department",
    name: "IT",
    fullName: "IT Department",
    bgColor: "#059669", // Emerald
    type: "letter",
  },
  {
    id: "CR(Central Registry)",
    name: "CR",
    fullName: "Central Registry",
    bgColor: "#DC2626", // Red
    type: "letter",
  },
  {
    id: "Academic department",
    name: "AC",
    fullName: "Academic Staff",
    bgColor: "#9333EA", // Purple
    type: "letter",
  },
];

const DepartmentsList = ({ onDepartmentSelect, selectedDepartment }) => {
  const handleDepartmentClick = (dept) => {
    // If clicking the already selected department, deselect it
    if (selectedDepartment === dept.id) {
      onDepartmentSelect(null);
    } else {
      onDepartmentSelect(dept.id);
    }
    console.log("Selected department:", dept.id); // Debug log
  };

  return (
    <div className="w-full overflow-x-auto py-3 border-b border-base-300">
      <div className="flex gap-3 min-w-max px-2">
        {departments.map((dept) => (
          <button
            key={dept.id}
            onClick={() => handleDepartmentClick(dept)}
            className={`flex flex-col items-center group ${
              selectedDepartment === dept.id ? "scale-105" : ""
            }`}
          >
            {/* Department Icon/Image */}
            <div
              className={`w-10 h-10 rounded-full overflow-hidden mb-1 
                ${selectedDepartment === dept.id ? "ring-2 ring-primary" : ""}
                ${
                  dept.type === "letter"
                    ? "flex items-center justify-center"
                    : ""
                }
              `}
              style={{
                backgroundColor:
                  dept.type === "letter" ? dept.bgColor : undefined,
              }}
            >
              {dept.type === "image" ? (
                <img
                  src={dept.image}
                  alt={dept.fullName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-sm font-bold text-white">
                  {dept.name}
                </span>
              )}
            </div>
            {/* Department Name */}
            <span className="text-[10px] font-medium text-base-content/70 group-hover:text-primary transition-colors">
              {dept.name}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default DepartmentsList;

import { useState, useRef, useEffect } from "react";

const departments = [
  {
    id: "SSU(Student Support Unit)",
    name: "SSU",
    fullName: "SSU(Student Support Unit)",
    image: "/SSU.jpg",
    type: "image",
  },
  {
    id: "LRC(Learning Resource Center)",
    name: "LRC",
    fullName: "LRC(Learning Resource Center)",
    image: "/LRC.jpg",
    type: "image",
  },
  {
    id: "EU(Exam Unit)",
    name: "EU",
    fullName: "EU(Exam Unit)",
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
    fullName: "CR(Central Registry)",
    bgColor: "#DC2626", // Red
    type: "letter",
  },
  {
    id: "Academic department",
    name: "AC",
    fullName: "Academic Department",
    bgColor: "#9333EA", // Purple
    type: "letter",
  },
];

const DepartmentsList = ({
  onDepartmentSelect,
  selectedDepartment,
  vertical,
  departmentFilter,
}) => {
  const scrollContainerRef = useRef(null);
  const [isScrolling, setIsScrolling] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);

  const handleDepartmentClick = (dept) => {
    if (selectedDepartment === dept.id) {
      onDepartmentSelect(null);
    } else {
      onDepartmentSelect(dept.id);
    }
  };

  // Filter departments by departmentFilter (case-insensitive)
  const filteredDepartments = departmentFilter
    ? departments.filter(
        (dept) =>
          dept.name.toLowerCase().includes(departmentFilter.toLowerCase()) ||
          dept.fullName.toLowerCase().includes(departmentFilter.toLowerCase())
      )
    : departments;

  // Only use horizontal scroll logic if not vertical
  useEffect(() => {
    if (vertical) return;
    const handleMouseUp = () => setIsScrolling(false);
    const handleMouseMove = (e) => {
      if (!isScrolling || !scrollContainerRef.current) return;
      e.preventDefault();
      const x = e.pageX - scrollContainerRef.current.offsetLeft;
      const walk = (x - startX) * 0.5;
      scrollContainerRef.current.scrollLeft = scrollLeft - walk;
    };
    document.addEventListener("mouseup", handleMouseUp);
    document.addEventListener("mousemove", handleMouseMove);
    return () => {
      document.removeEventListener("mouseup", handleMouseUp);
      document.removeEventListener("mousemove", handleMouseMove);
    };
  }, [isScrolling, startX, scrollLeft, vertical]);

  if (vertical) {
    return (
      <div className="flex flex-col gap-2">
        {filteredDepartments.map((dept) => (
          <button
            key={dept.id}
            onClick={() => handleDepartmentClick(dept)}
            className={`flex items-center gap-3 p-2 rounded-lg hover:bg-base-200 transition-colors ${
              selectedDepartment === dept.id
                ? "bg-primary/10 ring-2 ring-primary"
                : ""
            }`}
          >
            <div
              className={`w-11 h-11 rounded-full overflow-hidden flex items-center justify-center ${
                dept.type === "letter" ? "" : ""
              }`}
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
                  draggable="false"
                />
              ) : (
                <span className="text-base font-bold text-white">
                  {dept.name}
                </span>
              )}
            </div>
            <span className="text-sm font-medium text-base-content/80 text-left">
              {dept.fullName}
            </span>
          </button>
        ))}
      </div>
    );
  }

  // Horizontal (default)
  const handleMouseDown = (e) => {
    if (!scrollContainerRef.current) return;
    setIsScrolling(true);
    setStartX(e.pageX - scrollContainerRef.current.offsetLeft);
    setScrollLeft(scrollContainerRef.current.scrollLeft);
  };

  return (
    <div
      ref={scrollContainerRef}
      className="w-full overflow-x-scroll py-3 border-b border-base-300 scrollbar-hide touch-pan-x cursor-grab active:cursor-grabbing"
      onMouseDown={handleMouseDown}
    >
      <div className="flex gap-4 min-w-max px-2 select-none">
        {filteredDepartments.map((dept) => (
          <button
            key={dept.id}
            onClick={() => handleDepartmentClick(dept)}
            className={`flex flex-col items-center group ${
              selectedDepartment === dept.id ? "scale-105" : ""
            }`}
          >
            <div
              className={`w-[43.2px] h-[43.2px] rounded-full overflow-hidden mb-2 ${
                selectedDepartment === dept.id ? "ring-2 ring-primary" : ""
              } ${
                dept.type === "letter" ? "flex items-center justify-center" : ""
              }`}
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
                  draggable="false"
                />
              ) : (
                <span className="text-base font-bold text-white">
                  {dept.name}
                </span>
              )}
            </div>
            <span className="text-xs font-medium text-base-content/70 group-hover:text-primary transition-colors text-center max-w-[100px] whitespace-normal">
              {dept.fullName}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default DepartmentsList;
